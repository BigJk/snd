package git

import "github.com/BigJk/snd"

// Package represents a variant between Template, DataSource and Generator
// fetched from git.
type Package struct {
	Author  string `json:"author"`
	Type    string `json:"type"`
	Version string `json:"version"`

	Template   *snd.Template   `json:"template"`
	DataSource *snd.DataSource `json:"dataSource"`
	Generator  *snd.Generator  `json:"generator"`
	Entries    []snd.Entry     `json:"entries"`
}
