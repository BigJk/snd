package vtt

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/BigJk/snd"
)

type Module struct {
	Name        string      `json:"name"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Version     string      `json:"version"`
	Systems     []string    `json:"systems"`
	Author      interface{} `json:"author"`
	Authors     []struct {
		Name string `json:"name"`
	} `json:"authors"`
	Scripts   []interface{} `json:"scripts"`
	Esmodules []interface{} `json:"esmodules"`
	Styles    []interface{} `json:"styles"`
	Packs     []struct {
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
	Flags struct {
	} `json:"flags"`
	Type string `json:"type"`
	Img  string `json:"img"`
}

// ConvertPackEntries converts a .db FoundryVTT file to S&D entries.
func ConvertPackEntries(packFile string) ([]snd.Entry, error) {
	// Check if packFile is a directory
	fi, err := os.Stat(packFile)
	if err != nil {
		return nil, err
	}

	if fi.IsDir() {
		var entries []snd.Entry
		return entries, filepath.Walk(packFile, func(path string, info os.FileInfo, err error) error {
			if filepath.Ext(path) != ".json" || filepath.Base(path)[0] == '_' {
				return nil
			}

			fmt.Println(path)

			e, err := ConvertPackEntries(path)
			if err == nil {
				entries = append(entries, e...)
			} else {
				fmt.Println("error while converting pack entries:", err)
			}
			return nil
		})
	}

	packBytes, err := ioutil.ReadFile(packFile)
	if err != nil {
		return nil, err
	}

	packLines := []string{string(packBytes)}

	// Check if each line is it's own json object
	split := strings.Split(string(packBytes), "\n")
	if len(split) >= 1 {
		test := map[string]any{}
		if err := json.Unmarshal([]byte(split[0]), &test); err == nil {
			packLines = split
		}
	}

	var entries []snd.Entry
	for i := range packLines {
		if len(packLines[i]) <= 2 {
			continue
		}

		pack := PackEntry{}
		packRaw := map[string]any{}
		if err := json.Unmarshal([]byte(packLines[i]), &pack); err != nil {
			return nil, err
		}
		if err := json.Unmarshal([]byte(packLines[i]), &packRaw); err != nil {
			return nil, err
		}

		data := map[string]any{}
		data["name"] = pack.Name
		data["vtt_meta"] = map[string]interface{}{
			"ID":         pack.ID,
			"Img":        pack.Img,
			"Permission": pack.Permission,
			"Flags":      pack.Flags,
			"Type":       pack.Type,
		}

		for k, v := range packRaw {
			if k == "_id" || k == "name" || k == "permission" || k == "flags" || k == "type" || k == "img" {
				continue
			}
			data[k] = v
		}

		entries = append(entries, snd.Entry{
			ID:   pack.ID,
			Name: pack.Name,
			Data: data,
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

	if len(mod.Authors) > 0 {
		var authors []string
		for i := range mod.Authors {
			authors = append(authors, mod.Authors[i].Name)
		}
		author = strings.Join(authors, ", ")
	}

	var sources []snd.DataSource
	var sourceEntries [][]snd.Entry
	for i := range mod.Packs {
		fmt.Println(mod.Packs[i].Path)

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
