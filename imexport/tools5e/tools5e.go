// Package tools5e imports data from 5etools-style JSON dumps. It supports
// every 5etools data source (monster, spell, item, class, etc.) by reading
// the top-level map from a file and dispatching each list of entries
// through the renderer. The renderer rewrites {@tags} and structured-text
// blocks into markdown so the data can be consumed by snd as Entry.Data.
//
// Rendering is split across several files in this package:
//
//   ids.go     — name → ID / slug formatters
//   tags.go    — {@tag} handler
//   render.go  — generic entry / object walker and shared helpers
//   blocks.go  — block-type dispatcher and per-type renderers
//
// The importer itself lives at the bottom of this file.
package tools5e

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/BigJk/snd"
	"github.com/samber/lo"
)

// metaSource describes a single homebrew source pulled from a 5etools
// dump's `_meta.sources` array.
type metaSource struct {
	JSON         string
	Abbreviation string
	Full         string
	URL          string
	Authors      []string
}

// extractHomebrewSources pulls the first entry from `_meta.sources` in a
// 5etools homebrew dump. We currently only honour the first source since
// real-world homebrew dumps carry at most one.
func extractHomebrewSources(rawData map[string]interface{}) []metaSource {
	metaRaw, ok := rawData["_meta"].(map[string]interface{})
	if !ok || metaRaw == nil {
		return nil
	}

	sourcesRaw, ok := metaRaw["sources"].([]interface{})
	if !ok || len(sourcesRaw) == 0 {
		return nil
	}

	for _, sourceRaw := range sourcesRaw {
		sourceMap, ok := sourceRaw.(map[string]interface{})
		if !ok || sourceMap == nil {
			continue
		}

		source := metaSource{}
		if jsonValue, ok := sourceMap["json"].(string); ok {
			source.JSON = jsonValue
		}
		if abbreviationValue, ok := sourceMap["abbreviation"].(string); ok {
			source.Abbreviation = abbreviationValue
		}
		if fullValue, ok := sourceMap["full"].(string); ok {
			source.Full = fullValue
		}
		if urlValue, ok := sourceMap["url"].(string); ok {
			source.URL = urlValue
		}
		if authorsRaw, ok := sourceMap["authors"].([]interface{}); ok {
			for _, authorRaw := range authorsRaw {
				if author, ok := authorRaw.(string); ok {
					if trimmed := strings.TrimSpace(author); trimmed != "" {
						source.Authors = append(source.Authors, trimmed)
					}
				}
			}
		}

		if source.JSON != "" || source.Abbreviation != "" || source.Full != "" || source.URL != "" {
			return []metaSource{source}
		}
	}

	return nil
}

// ImportFile reads a single 5etools JSON file and returns the data sources
// and entries it contains. The file is expected to be a top-level map of
// data-source-name → list-of-entries. Each entry must have a string "name"
// field; entries that don't are silently dropped.
func ImportFile(path string) ([]snd.DataSource, [][]snd.Entry, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, err
	}
	var rawData map[string]interface{}
	if err := json.Unmarshal(content, &rawData); err != nil {
		return nil, nil, err
	}

	var allSources []snd.DataSource
	var allEntries [][]snd.Entry
	homebrewSources := extractHomebrewSources(rawData)

	for dataSourceName, dataSource := range rawData {
		if dataSourceName == "_meta" {
			continue
		}

		newEntriesList, ok := dataSource.([]interface{})
		if !ok {
			fmt.Printf("Data source '%s' is not a list of dictonaries!\n", dataSourceName)
			continue
		}

		if len(homebrewSources) == 0 {
			allSources = append(allSources, snd.DataSource{
				Name:        fmt.Sprintf("5e Tools %s", strings.Title(dataSourceName)),
				Slug:        fmt.Sprintf("5e-tools-%s", dataSourceName),
				Author:      "Nth",
				Description: fmt.Sprintf("Imported %s data from 5e tools", dataSourceName),
			})
			allEntries = append(allEntries, nil)

			for _, entryData := range newEntriesList {
				entryData, isMap := entryData.(map[string]interface{})
				if !isMap || entryData == nil || entryData["name"] == nil {
					continue
				}

				entryName, isString := entryData["name"].(string)
				if !isString {
					continue
				}

				entryID := makeID(entryName)

				renderObject(entryData)

				allEntries[len(allEntries)-1] = append(allEntries[len(allEntries)-1], snd.Entry{
					Name: entryName,
					ID:   entryID,
					Data: entryData,
				})
			}
			continue
		}

		sourceKeyToIndex := map[string]int{}
		firstSourceIndex := -1
		for _, source := range homebrewSources {
			sourceName := source.Full
			if sourceName == "" {
				sourceName = source.Abbreviation
			}
			if sourceName == "" {
				sourceName = source.JSON
			}
			if sourceName == "" {
				sourceName = "Homebrew"
			}

			author := "None"
			if len(source.Authors) > 0 {
				author = strings.Join(source.Authors, ", ")
			}

			sourceSlugBase := sourceName
			if sourceSlugBase == "" {
				sourceSlugBase = "homebrew"
			}

			allSources = append(allSources, snd.DataSource{
				Name:        fmt.Sprintf("%s (%s)", sourceName, strings.Title(dataSourceName)),
				Slug:        fmt.Sprintf("5e-tools-%s-%s", makeSlug(sourceSlugBase), dataSourceName),
				Author:      author,
				Description: fmt.Sprintf("Imported %s data from %s", dataSourceName, sourceName),
			})
			allEntries = append(allEntries, nil)

			idx := len(allSources) - 1
			if firstSourceIndex == -1 {
				firstSourceIndex = idx
			}
			for _, key := range []string{source.Abbreviation, source.JSON, source.Full} {
				if key != "" {
					sourceKeyToIndex[strings.ToLower(key)] = idx
				}
			}
		}

		for _, entryData := range newEntriesList {
			entryData, isMap := entryData.(map[string]interface{})
			if !isMap || entryData == nil || entryData["name"] == nil {
				continue
			}

			entryName, isString := entryData["name"].(string)
			if !isString {
				continue
			}

			entryID := makeID(entryName)

			targetIndex := -1
			if sourceValue, ok := entryData["source"].(string); ok {
				if idx, ok := sourceKeyToIndex[strings.ToLower(sourceValue)]; ok {
					targetIndex = idx
				}
			}
			if targetIndex == -1 && firstSourceIndex != -1 && len(homebrewSources) == 1 {
				targetIndex = firstSourceIndex
			}
			if targetIndex == -1 {
				continue
			}

			renderObject(entryData)

			allEntries[targetIndex] = append(allEntries[targetIndex], snd.Entry{
				Name: entryName,
				ID:   entryID,
				Data: entryData,
			})
		}
	}

	return allSources, allEntries, nil
}

// ImportFolder walks `path` recursively and merges every *.json file into
// the returned sources / entries. Files that fail to import are logged to
// stdout and skipped, so a single bad file doesn't abort the whole walk.
func ImportFolder(path string) ([]snd.DataSource, [][]snd.Entry, error) {
	allSources := map[string]snd.DataSource{}
	allEntries := map[string]map[string]snd.Entry{}

	err := filepath.WalkDir(path, func(filePath string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			fmt.Printf("Failed to access path: %s (%s)\n", filePath, walkErr)
			return nil
		}
		if d.IsDir() {
			return nil
		}
		if !strings.HasSuffix(d.Name(), ".json") {
			return nil
		}

		sources, entries, err := ImportFile(filePath)
		if err != nil {
			fmt.Printf("Failed to import file: %s (%s)\n", filePath, err)
			return nil
		}

		for _, source := range sources {
			allSources[source.Slug] = source
		}

		for i, entryList := range entries {
			for _, entry := range entryList {
				if _, ok := allEntries[sources[i].Slug]; !ok {
					allEntries[sources[i].Slug] = map[string]snd.Entry{}
				}
				allEntries[sources[i].Slug][entry.ID] = entry
			}
		}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}

	keys := lo.Keys(allSources)
	return lo.Map(keys, func(key string, _ int) snd.DataSource {
			return allSources[key]
		}), lo.Map(keys, func(key string, _ int) []snd.Entry {
			return lo.Values(allEntries[key])
		}), nil
}