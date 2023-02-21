package snd

import (
	"fmt"
	"strings"
)

type TemplateConfig struct {
	Key         string      `json:"key"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Type        string      `json:"type"`
	Default     interface{} `json:"default"`
}

// Template represents one S&D template.
type Template struct {
	Name          string                 `json:"name"`
	Slug          string                 `json:"slug"`
	Author        string                 `json:"author"`
	Description   string                 `json:"description"`
	PrintTemplate string                 `json:"printTemplate"`
	ListTemplate  string                 `json:"listTemplate"`
	SkeletonData  map[string]interface{} `json:"skeletonData"`
	Images        map[string]string      `json:"images"`
	Config        []TemplateConfig       `json:"config"`
	DataSources   []string               `json:"dataSources"`
	Version       string                 `json:"version"`
}

func (t Template) ID() string {
	return fmt.Sprintf("tmpl:%s+%s", t.Author, t.Slug)
}

func IsTemplateID(id string) bool {
	return strings.HasPrefix(id, "tmpl:")
}
