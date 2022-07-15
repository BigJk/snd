package vtt

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"

	"github.com/BigJk/snd"
)

type Module struct {
	Name        string        `json:"name"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	Version     string        `json:"version"`
	Systems     []string      `json:"systems"`
	Author      interface{}   `json:"author"`
	Scripts     []interface{} `json:"scripts"`
	Esmodules   []interface{} `json:"esmodules"`
	Styles      []interface{} `json:"styles"`
	Packs       []struct {
		Name    string `json:"name"`
		Label   string `json:"label"`
		Package string `json:"package"`
		Path    string `json:"path"`
		Entity  string `json:"entity"`
	} `json:"packs"`
	MinimumCoreVersion    string `json:"minimumCoreVersion"`
	CompatibleCoreVersion string `json:"compatibleCoreVersion"`
	URL                   string `json:"url"`
	Manifest              string `json:"manifest"`
	Download              string `json:"download"`
}

type PackEntry struct {
	ID         string `json:"_id"`
	Name       string `json:"name"`
	Permission struct {
		Default int `json:"default"`
	} `json:"permission"`
	Data  map[string]interface{} `json:"data"`
	Flags struct {
	} `json:"flags"`
	Type string `json:"type"`
	Img  string `json:"img"`
}

// ConvertPackEntries converts a .db FoundryVTT file to S&D entries.
func ConvertPackEntries(packFile string) ([]snd.Entry, error) {
	packBytes, err := ioutil.ReadFile(packFile)
	if err != nil {
		return nil, err
	}

	packLines := strings.Split(string(packBytes), "\n")

	var entries []snd.Entry
	for i := range packLines {
		if len(packLines[i]) <= 2 {
			continue
		}

		pack := PackEntry{}
		if err := json.Unmarshal([]byte(packLines[i]), &pack); err != nil {
			return nil, err
		}

		if pack.Data == nil {
			continue
		}

		pack.Data["name"] = pack.Name
		pack.Data["vtt_meta"] = map[string]interface{}{
			"ID":         pack.ID,
			"Img":        pack.Img,
			"Permission": pack.Permission,
			"Flags":      pack.Flags,
			"Type":       pack.Type,
		}

		entries = append(entries, snd.Entry{
			ID:   pack.ID,
			Name: pack.Name,
			Data: pack.Data,
		})
	}

	return entries, nil
}

// ConvertDataSources parses a FoundryVTT module.json or system.json file and converts all the specified packs to
// S&D data sources and entries.
func ConvertDataSources(moduleFile string) ([]snd.DataSource, [][]snd.Entry, error) {
	moduleBytes, err := ioutil.ReadFile(moduleFile)
	if err != nil {
		return nil, nil, err
	}

	mod := Module{}
	if err := json.Unmarshal(moduleBytes, &mod); err != nil {
		return nil, nil, err
	}

	author := ""

	switch mod.Author.(type) {
	case string:
		author = mod.Author.(string)
	case []string:
		author = strings.Join(mod.Author.([]string), ", ")
	}

	var sources []snd.DataSource
	var sourceEntries [][]snd.Entry
	for i := range mod.Packs {
		entries, err := ConvertPackEntries(filepath.Join(filepath.Dir(moduleFile), "/", mod.Packs[i].Path))
		if err != nil {
			return nil, nil, err
		}

		if len(entries) == 0 {
			continue
		}

		source := snd.DataSource{
			Name:        fmt.Sprintf("%s (%s)", mod.Title, mod.Packs[i].Label),
			Slug:        fmt.Sprintf("%s-%s", mod.Name, mod.Packs[i].Name),
			Author:      author,
			Description: mod.Description,
			Version:     mod.Version,
		}

		sources = append(sources, source)
		sourceEntries = append(sourceEntries, entries)
	}

	return sources, sourceEntries, nil
}
