package snd

import "fmt"

type GeneratorConfig struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Type        string      `json:"type"`
	Data        interface{} `json:"data"`
	Default     interface{} `json:"default"`
}

// Generator represents one S&D generator. Instead of working with
// fixed data entries like the template a generator procedurally generates
// new entries to print on the spot.
type Generator struct {
	Name          string                     `json:"name"`
	Slug          string                     `json:"slug"`
	Author        string                     `json:"author"`
	Description   string                     `json:"description"`
	PrintTemplate string                     `json:"printTemplate"`
	Config        map[string]GeneratorConfig `json:"config"`
	Images        map[string]string          `json:"images"`
	DataSources   []string                   `json:"dataSources"`
	Version       string                     `json:"version"`
}

func (t Generator) ID() string {
	return fmt.Sprintf("gen:%s+%s", t.Author, t.Slug)
}
