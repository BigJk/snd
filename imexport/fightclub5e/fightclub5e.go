package fightclub5e

import (
	"os"
	"strings"

	"github.com/BigJk/snd"
	"github.com/antchfx/xmlquery"
	"github.com/sbabiv/xml2map"
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
		sources = append(sources, snd.DataSource{
			Name:        name + " - " + names[i],
			Slug:        slug + "-" + types[i],
			Author:      author,
			Description: description,
			Version:     "",
		})

		var entries []snd.Entry

		xmlquery.FindEach(n, "//"+types[i], func(j int, node *xmlquery.Node) {
			data, err := xml2map.NewDecoder(strings.NewReader(node.OutputXML(true))).Decode()
			if err == nil {
				name := data[types[i]].(map[string]interface{})["name"].(string)
				entryData := data[types[i]].(map[string]interface{})

				entries = append(entries, snd.Entry{
					ID:   name,
					Name: name,
					Data: entryData,
				})
			}
		})

		allEntries = append(allEntries, entries)
	}

	return sources, allEntries, nil
}
