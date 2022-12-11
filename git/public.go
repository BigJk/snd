package git

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
)

type Public struct {
	Name        string        `json:"name"`
	Author      string        `json:"author"`
	Description string        `json:"description"`
	Entries     []PublicEntry `json:"entries"`
}

type PublicEntry struct {
	Author  string   `json:"author"`
	Contact string   `json:"contact"`
	Repos   []string `json:"repos"`
}

func GetPackages(url string) (Public, error) {
	res, err := http.Get(url)
	if err != nil {
		return Public{}, err
	}
	defer res.Body.Close()

	bytes, err := ioutil.ReadAll(res.Body)
	if err != nil {
		return Public{}, err
	}

	var public Public
	if err := json.Unmarshal(bytes, &public); err != nil {
		return Public{}, err
	}

	return public, nil
}
