package git

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
)

// PublicList represents a curated list of public package entries.
type PublicList struct {
	Name        string        `json:"name"`
	Author      string        `json:"author"`
	Description string        `json:"description"`
	Entries     []PublicEntry `json:"entries"`
}

// PublicEntry represents an entry in the public package repository by some Author.
// One entry can contain multiple git repos where packages for S&D are stored.
type PublicEntry struct {
	Author  string      `json:"author"`
	Contact string      `json:"contact"`
	Repos   []RepoEntry `json:"repos"`
}

// RepoEntry represents a single git repository with packages for S&D.
type RepoEntry struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
}

// GetPackages fetches a PublicList by URL. It expects a JSON encoded file.
func GetPackages(url string) (PublicList, error) {
	res, err := http.Get(url)
	if err != nil {
		return PublicList{}, err
	}
	defer res.Body.Close()

	bytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return PublicList{}, err
	}

	var public PublicList
	if err := json.Unmarshal(bytes, &public); err != nil {
		return PublicList{}, err
	}

	return public, nil
}
