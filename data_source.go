package snd

import (
	"fmt"
	"strings"
)

// DataSource represents a data source in S&D.
type DataSource struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Author      string `json:"author"`
	Description string `json:"description"`
	Version     string `json:"version"`
}

func (ds DataSource) ID() string {
	return fmt.Sprintf("ds:%s+%s", ds.Author, ds.Slug)
}

func IsDataSourceID(id string) bool {
	return strings.HasPrefix(id, "ds:")
}
