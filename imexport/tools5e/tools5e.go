package tools5e

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/BigJk/snd"
	"github.com/samber/lo"
)

var nonAlphanumericRegex = regexp.MustCompile(`[^a-zA-Z0-9 ]+`)
var spacesRegex = regexp.MustCompile(`\s+`)

// Formats an arbitrary name into a valid ID
func makeID(str string) string {
	cleanStr := nonAlphanumericRegex.ReplaceAllString(str, "")
	kebabStr := spacesRegex.ReplaceAllString(cleanStr, "-")
	return fmt.Sprintf("5etools/%s", strings.ToLower(kebabStr))
}

// Formats an arbitrary name into a slug fragment
func makeSlug(str string) string {
	cleanStr := nonAlphanumericRegex.ReplaceAllString(str, "")
	kebabStr := spacesRegex.ReplaceAllString(cleanStr, "-")
	return strings.ToLower(kebabStr)
}

// Naive function to walk a json object and recursively render string nodes
func renderObject(data interface{}) interface{} {

	// If object is a dictionary, render the contents
	if dict, ok := data.(map[string]interface{}); ok {

		// Look for an entries map, and collapse the content into markdown
		if entries, ok := dict["entries"].([]interface{}); ok {
			delete(dict, "entries")
			dict["entry"] = renderEntries(entries, "") // Top level, so prefix is empty

			// Manually render entry names
			if name, ok := dict["name"].(string); ok {
				dict["name"] = renderString(name)
			}

		} else {
			// Otherwise recurse into the leaves
			for key, value := range dict {
				dict[key] = renderObject(value)
			}
		}
		return dict
	}

	// If object is a list recurse into leaves
	if list, ok := data.([]interface{}); ok {
		for i, item := range list {
			list[i] = renderObject(item)
		}
		return list
	}

	// If object is a string, render the string
	if str, ok := data.(string); ok {
		return renderString(str)
	}

	// Otherwise do nothing
	return data
}

// Renders a list of entries to a markdown fragment
// The prefix is the indentation information for the fragment and is appended after
// each internal newline. Used for contextual blocks.
func renderEntries(entries []interface{}, prefix string) string {
	var paragraphs []string
	for _, entry := range entries {
		e, _ := renderEntry(entry, prefix)
		paragraphs = append(paragraphs, e)
	}
	return strings.Join(paragraphs, "\n"+prefix)
}

// Matches tags, with the tag name in the first capture group and the remainder in the second
var tagRegexp = regexp.MustCompile(`\{@([a-zA-z]+) ?([^\}]*)\}`)

// Render a structrued text entry into a markdown fragment
// The prefix carries the indentation information for the fragment
func renderEntry(entry interface{}, prefix string) (string, error) {
	if text, ok := entry.(string); ok {
		return renderString(text), nil
	}

	if block, ok := entry.(map[string]interface{}); ok {
		if blockType, ok := block["type"].(string); ok {
			return renderBlock(blockType, block, prefix), nil
		}
	}

	return "", errors.New("unsupported entry")
}

// Renders a string containing 5etools {@tags}
func renderString(str string) string {
	head := 0
	out := ""
	tags := tagRegexp.FindAllStringSubmatchIndex(str, -1)
	// Splice out the tags and replace them with the result of `renderTag`
	for _, tag := range tags {
		tagType := str[tag[2]:tag[3]]
		tagContent := str[tag[4]:tag[5]]
		out = out + str[head:tag[0]] + renderTag(tagType, tagContent)
		head = tag[1]
	}
	return out + str[head:]
}

// Determines what we display instead of `{@tag content}`
func renderTag(tag string, content string) string {
	switch tag {
	case "italic", "i":
		return "*" + content + "*"
	case "bold", "b", "dc":
		return "**" + content + "**"
	case "code":
		return "`" + content + "`"
	case "atk":
		return attackTag(content)
	case "h":
		return "*Hit:* "
	case "hit":
		// We should double check that this wont create double pluses.
		return "+" + content
	case "dice":
		// In future we may want to parse the 5etools dice format, but this is good enough for now
		sections := strings.Split(content, "|")
		if len(sections) >= 2 {
			return sections[1]
		} else {
			return sections[0]
		}
	case "recharge":
		if len(content) > 0 {
			return fmt.Sprintf("(Recharge %s-6)", content)
		} else {
			return "(Recharge 6)"
		}
	case "filter", "footnote":
		// Tags with multiple sections where we always render the first one
		sections := strings.Split(content, "|")
		return sections[0]
	case "link":
		// Tags with optional link text after the first pipe
		sections := strings.Split(content, "|")
		if len(sections) >= 2 {
			return "**" + sections[1] + "**"
		} else {
			return "**" + sections[0] + "**"
		}
	case "spell", "item", "creature", "legroup", "background", "race", "optfeature", "class",
		"classFeature", "subclassFeature", "condition", "disease", "reward", "feat", "psionic", "object",
		"boon", "cult", "trap", "hazard", "deities", "variantRule", "vehicle", "vehupgrade", "table",
		"action", "language", "charoption", "recipe", "deck", "card":
		// Tags with optional link text after the second pipe
		sections := strings.Split(content, "|")
		if len(sections) >= 3 {
			return "**" + strings.Title(sections[2]) + "**"
		} else {
			return "**" + strings.Title(sections[0]) + "**"
		}
	case "quickref":
		// Tags with optional link text after the fifth pipe
		sections := strings.Split(content, "|")
		if len(sections) >= 5 {
			return "**" + sections[4] + "**"
		} else {
			return "**" + sections[0] + "**"
		}
	default:
		return content
	}
}

// The @atk tag uses the form (m|r|a)(w|s)[,(m|r|a)(w|s)]+
// This function renders that back into the standard words.
func attackTag(attackTypes string) string {
	attacks := make([]string, 0)
	for _, attackType := range strings.Split(attackTypes, ",") {
		attack := ""
		if strings.Contains(attackType, "m") {
			attack = attack + "Melee "
		} else if strings.Contains(attackType, "r") {
			attack = attack + "Ranged "
		} else if strings.Contains(attackType, "a") {
			attack = attack + "Area "
		}
		if strings.Contains(attackType, "w") {
			attack = attack + "Weapon "
		} else if strings.Contains(attackType, "s") {
			attack = attack + "Spell "
		}
		attacks = append(attacks, attack)
	}
	return "*" + strings.Join(attacks, "or ") + "Attack:*"
}

// Renders a structured text block
func renderBlock(blockType string, block map[string]interface{}, prefix string) string {
	switch blockType {
	case "quote":
		return quoteBlock(block, prefix)
	case "list":
		return listBlock(block, prefix)
	case "entries":
		return entriesBlock(block, prefix)
	default:
		return prefix + "Unsuported Block: " + blockType
	}
}

// Render a quote block with a possible attribution
func quoteBlock(block map[string]interface{}, prefix string) string {
	if entries, ok := block["entries"].([]interface{}); ok {

		out := "> " + renderEntries(entries, prefix+"> ")

		// Generate attribution line
		attribution := make([]string, 0)
		if by, ok := block["by"].(string); ok {
			attribution = append(attribution, by)
		}
		if from, ok := block["from"].(string); ok {
			attribution = append(attribution, "*"+from+"*")
		}
		if len(attribution) > 0 {
			out = out + "\n> — " + strings.Join(attribution, ", ")
		}

		return out
	}
	return ""
}

// Render a list block
func listBlock(block map[string]interface{}, prefix string) string {
	if items, ok := block["items"].([]interface{}); ok {
		lines := make([]string, 0)
		for _, item := range items {
			// TODO: error handling
			e, _ := renderEntry(item, prefix+"  ")
			lines = append(lines, "+ "+e)
		}
		return strings.Join(lines, "\n")
	}
	return ""
}

// Render an entries block with a possible heading
func entriesBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok {
		out = "**" + name + ".** "
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out = out + renderEntries(entries, prefix)
	}
	return out
}

type metaSource struct {
	JSON         string
	Abbreviation string
	Full         string
	URL          string
	Authors      []string
}

func extractHomebrewSources(rawData map[string]interface{}) []metaSource {
	metaRaw, ok := rawData["_meta"].(map[string]interface{})
	if !ok || metaRaw == nil {
		return nil
	}

	sourcesRaw, ok := metaRaw["sources"].([]interface{})
	if !ok || len(sourcesRaw) == 0 {
		return nil
	}

	var sources []metaSource
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
					trimmed := strings.TrimSpace(author)
					if trimmed != "" {
						source.Authors = append(source.Authors, trimmed)
					}
				}
			}
		}

		if source.JSON != "" || source.Abbreviation != "" || source.Full != "" || source.URL != "" {
			sources = append(sources, source)

			// We ignore any past the first for now. In all cases that I saw there is just 1 anyways
			break
		}
	}

	return sources
}

func ImportFile(path string) ([]snd.DataSource, [][]snd.Entry, error) {
	// Read the listed file into a dictionary
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, nil, err
	}
	var rawData map[string]interface{}
	err = json.Unmarshal(content, &rawData)
	if err != nil {
		return nil, nil, err
	}

	var allSources []snd.DataSource
	var allEntries [][]snd.Entry
	homebrewSources := extractHomebrewSources(rawData)

	// Loop over the different data-sources in this file
	for dataSourceName, dataSource := range rawData {
		// Skip the metadata entry
		if dataSourceName == "_meta" {
			continue
		}

		// Access the list of raw entries from the data source
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

			// Render and add the new entries
			for _, entryData := range newEntriesList {
				entryData, isMap := entryData.(map[string]interface{})
				if !isMap || entryData == nil || entryData["name"] == nil {
					continue
				}

				// Pop the entry name out of the data
				entryName, isString := entryData["name"].(string)
				if !isString {
					continue
				}

				entryId := makeID(entryName)
				delete(entryData, "name")

				// Render text to markdown
				renderObject(entryData)

				// Write the finished entry
				allEntries[len(allEntries)-1] = append(allEntries[len(allEntries)-1], snd.Entry{
					Name: entryName,
					ID:   entryId,
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

		// Render and add the new entries
		for _, entryData := range newEntriesList {
			entryData, isMap := entryData.(map[string]interface{})
			if !isMap || entryData == nil || entryData["name"] == nil {
				continue
			}

			// Pop the entry name out of the data
			entryName, isString := entryData["name"].(string)
			if !isString {
				continue
			}

			entryId := makeID(entryName)
			delete(entryData, "name")

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

			// Render text to markdown
			renderObject(entryData)

			// Write the finished entry
			allEntries[targetIndex] = append(allEntries[targetIndex], snd.Entry{
				Name: entryName,
				ID:   entryId,
				Data: entryData,
			})
		}
	}

	return allSources, allEntries, nil
}

func ImportFolder(path string) ([]snd.DataSource, [][]snd.Entry, error) {
	allSources := map[string]snd.DataSource{}
	allEntries := map[string]map[string]snd.Entry{}

	// Walk the folder recursively
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

		// Import the file
		sources, entries, err := ImportFile(filePath)
		if err != nil {
			fmt.Printf("Failed to import file: %s (%s)\n", filePath, err)
			return nil
		}

		// Merge the sources
		for _, source := range sources {
			allSources[source.Slug] = source
		}

		// Merge the entries
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
	return lo.Map(keys, func(key string, i int) snd.DataSource {
			return allSources[key]
		}), lo.Map(keys, func(key string, i int) []snd.Entry {
			return lo.Values(allEntries[key])
		}), nil
}
