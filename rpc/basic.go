package rpc

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"regexp"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/labstack/echo/v4"
	"golang.org/x/exp/slices"
)

type GitHubTags []struct {
	Name       string `json:"name"`
	ZipballURL string `json:"zipball_url"`
	TarballURL string `json:"tarball_url"`
	Commit     struct {
		Sha string `json:"sha"`
		URL string `json:"url"`
	} `json:"commit"`
	NodeID string `json:"node_id"`
}

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
		if len(tags) == 0 {
			return nil, errors.New("could not fetch newest version")
		}

		return struct {
			LocalVersion  interface{} `json:"localVersion"`
			LatestVersion interface{} `json:"latestVersion"`
		}{localVersion, tags[0]}, nil
	})))
}
