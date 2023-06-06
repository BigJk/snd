package rpc

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"regexp"
	"strings"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/labstack/echo/v4"
	"github.com/vincent-petithory/dataurl"
	"golang.org/x/exp/slices"
)

type GitHubCommit struct {
	Sha string `json:"sha"`
	URL string `json:"url"`
}

type GitHubTag struct {
	Name       string       `json:"name"`
	ZipballURL string       `json:"zipball_url"`
	TarballURL string       `json:"tarball_url"`
	Commit     GitHubCommit `json:"commit"`
	NodeID     string       `json:"node_id"`
}

type GitHubTags []GitHubTag

var tagNameRegex = regexp.MustCompile(`^v\d+.\d+.\d+`)

func fetchTags() (GitHubTags, error) {
	if len(snd.GitCommitHash) == 0 {
		return nil, errors.New("non release build. Skipping latest version fetching")
	}

	resp, err := http.Get("https://api.github.com/repos/BigJk/snd/tags")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tags GitHubTags
	if err := json.Unmarshal(data, &tags); err != nil {
		return nil, err
	}

	// filter tags that don't match vX.X.X pattern.
	for i := 0; i < len(tags); i++ {
		if !tagNameRegex.MatchString(tags[i].Name) {
			tags = slices.Delete(tags, i, i+1)
			i--
		}
	}

	if len(tags) == 0 {
		return nil, errors.New("tags empty")
	}

	return tags, nil
}

func RegisterBasic(route *echo.Group, db database.Database) {
	localVersion := struct {
		BuildTime     string `json:"buildTime"`
		GitCommitHash string `json:"gitCommitHash"`
		GitBranch     string `json:"gitBranch"`
	}{
		BuildTime:     snd.BuildTime,
		GitCommitHash: snd.GitCommitHash,
		GitBranch:     snd.GitBranch,
	}

	if len(os.Getenv("SND_MOCK_BUILD_TIME")) > 0 {
		localVersion.BuildTime = os.Getenv("SND_MOCK_BUILD_TIME")
	}

	if len(os.Getenv("SND_MOCK_GIT_COMMIT_HASH")) > 0 {
		localVersion.GitCommitHash = os.Getenv("SND_MOCK_GIT_COMMIT_HASH")
	}

	if len(os.Getenv("SND_MOCK_GIT_BRANCH")) > 0 {
		localVersion.GitBranch = os.Getenv("SND_MOCK_GIT_BRANCH")
	}

	tags, err := fetchTags()
	if err != nil {
		_ = log.Error(err)
	}

	route.POST("/getVersion", echo.WrapHandler(nra.MustBind(func() (interface{}, error) {
		return localVersion, nil
	})))

	route.POST("/getSettings", echo.WrapHandler(nra.MustBind(db.GetSettings)))
	route.POST("/saveSettings", echo.WrapHandler(nra.MustBind(db.SaveSettings)))
	route.POST("/getLogs", echo.WrapHandler(nra.MustBind(db.GetLogs)))

	route.POST("/newVersion", echo.WrapHandler(nra.MustBind(func() (interface{}, error) {
		type resp struct {
			LocalVersion  interface{} `json:"localVersion"`
			LatestVersion interface{} `json:"latestVersion"`
			Newest        bool        `json:"newest"`
		}

		if len(os.Getenv("SND_MOCK_NEWEST")) > 0 {
			isNew := os.Getenv("SND_MOCK_NEWEST") == "1"

			return resp{localVersion, GitHubTag{
				Name:       os.Getenv("SND_MOCK_NEWEST_TAG"),
				ZipballURL: "",
				TarballURL: "",
				Commit: GitHubCommit{
					Sha: "",
					URL: "",
				},
				NodeID: "",
			}, isNew}, nil
		}

		if len(tags) == 0 {
			return nil, errors.New("could not fetch newest version")
		}

		return resp{localVersion, tags[0], localVersion.GitCommitHash == tags[0].Commit.Sha}, nil
	})))

	route.POST("/fetchImage", echo.WrapHandler(nra.MustBind(func(url string) (string, error) {
		resp, err := http.Get(url)
		if err != nil {
			return "", err
		}

		if !strings.HasPrefix(resp.Header.Get("Content-Type"), "image/") {
			return "", errors.New("not a image")
		}

		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}

		return dataurl.EncodeBytes(data), nil
	})))
}
