package fightclub5e

import (
	"fmt"
	"os"
	"strings"

	"github.com/BigJk/snd"
	"github.com/antchfx/xmlquery"
)

func ImportCompedium(filePath string, name string, author string, slug string, description string) ([]snd.DataSource, [][]snd.Entry, error) {
	file, err := os.OpenFile(filePath, os.O_RDONLY, 0666)
	if err != nil {
		return nil, nil, err
	}
	defer file.Close()

	n, err := xmlquery.Parse(file)
	if err != nil {
		return nil, nil, err
	}

	types := []string{"item", "monster", "race", "background", "spell", "feat", "class"}
	names := []string{"Items", "Monsters", "Races", "Backgrounds", "Spells", "Feats", "Classes"}

	var sources []snd.DataSource
	var allEntries [][]snd.Entry
	for i := range types {
		var entries []snd.Entry

		xmlquery.FindEach(n, "//"+types[i], func(j int, node *xmlquery.Node) {
			entryData, ok := xmlNodeToMap(node).(map[string]interface{})
			if !ok {
				return
			}

			entryName := extractEntryName(entryData["name"])
			if entryName == "" {
				if nameNode := xmlquery.FindOne(node, "./name"); nameNode != nil {
					entryName = strings.TrimSpace(nameNode.InnerText())
				}
			}
			if entryName == "" {
				entryName = fmt.Sprintf("%s-%d", types[i], j+1)
			}

			entries = append(entries, snd.Entry{
				ID:   entryName,
				Name: entryName,
				Data: entryData,
			})
		})

		if len(entries) == 0 {
			continue
		}

		allEntries = append(allEntries, entries)

		sources = append(sources, snd.DataSource{
			Name:        name + " - " + names[i],
			Slug:        slug + "-" + types[i],
			Author:      author,
			Description: description,
			Version:     "",
		})

	}

	return sources, allEntries, nil
}

func xmlNodeToMap(node *xmlquery.Node) interface{} {
	var childElements []*xmlquery.Node
	var textBuilder strings.Builder

	for child := node.FirstChild; child != nil; child = child.NextSibling {
		switch child.Type {
		case xmlquery.ElementNode:
			childElements = append(childElements, child)
		case xmlquery.TextNode, xmlquery.CharDataNode:
			textBuilder.WriteString(child.Data)
		}
	}

	text := strings.TrimSpace(textBuilder.String())
	if len(childElements) == 0 && len(node.Attr) == 0 {
		return text
	}

	data := map[string]interface{}{}
	for _, attr := range node.Attr {
		key := "@" + attr.Name.Local
		if attr.Name.Space != "" {
			key = "@" + attr.Name.Space + ":" + attr.Name.Local
		}
		data[key] = attr.Value
	}
	if text != "" {
		data["#text"] = text
	}

	for _, child := range childElements {
		val := xmlNodeToMap(child)
		if existing, ok := data[child.Data]; ok {
			switch v := existing.(type) {
			case []interface{}:
				data[child.Data] = append(v, val)
			default:
				data[child.Data] = []interface{}{v, val}
			}
		} else {
			data[child.Data] = val
		}
	}

	return data
}

func extractEntryName(value interface{}) string {
	switch v := value.(type) {
	case string:
		return strings.TrimSpace(v)
	case map[string]interface{}:
		if t, ok := v["#text"].(string); ok {
			return strings.TrimSpace(t)
		}
	case []interface{}:
		for _, item := range v {
			if name := extractEntryName(item); name != "" {
				return name
			}
		}
	}

	return ""
}
