package snd

import (
	"fmt"
	"strings"
)

type GeneratorConfig struct {
	Key         string      `json:"key"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Type        string      `json:"type"`
	Default     interface{} `json:"default"`
}

// Generator represents one S&D generator. Instead of working with
// fixed data entries like the template a generator procedurally generates
// new entries to print on the spot.
type Generator struct {
	Name            string            `json:"name"`
	Slug            string            `json:"slug"`
	Author          string            `json:"author"`
	Description     string            `json:"description"`
	CopyrightNotice string            `json:"copyrightNotice"`
	PrintTemplate   string            `json:"printTemplate"`
	PassEntriesToJS bool              `json:"passEntriesToJS"`
	Config          []GeneratorConfig `json:"config"`
	Images          map[string]string `json:"images"`
	DataSources     []string          `json:"dataSources"`
	Version         string            `json:"version"`
}

func (t Generator) ID() string {
	return fmt.Sprintf("gen:%s+%s", t.Author, t.Slug)
}

func IsGeneratorID(id string) bool {
	return strings.HasPrefix(id, "gen:")
}
