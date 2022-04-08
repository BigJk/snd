package snd

import "fmt"

// Template represents one S&D template
type Template struct {
	Name          string                 `json:"name"`
	Slug          string                 `json:"slug"`
	Author        string                 `json:"author"`
	Description   string                 `json:"description"`
	PrintTemplate string                 `json:"printTemplate"`
	ListTemplate  string                 `json:"listTemplate"`
	SkeletonData  map[string]interface{} `json:"skeletonData"`
	DataSources   []string               `json:"dataSources"`
	URL           string                 `json:"url"`
}

func (t Template) ID() string {
	return fmt.Sprintf("tmpl:%s+%s", t.Author, t.Slug)
}
