// Package database represents the data layer of S&D.
package database

import (
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
)

// TemplateEntry represents a S&D template together with the amount of entries it has.
type TemplateEntry struct {
	snd.Template
	Count int `json:"count"`
}

// DataSourceEntry represents a S&D data source together with the amount of entries it has.
type DataSourceEntry struct {
	snd.DataSource
	Count int `json:"count"`
}

// Database represents all database functions that are needed for S&D to work.
type Database interface {
	Close() error

	GetSettings() (snd.Settings, error)
	SaveSettings(settings snd.Settings) error

	GetLogs(hours int) ([]log.Entry, error)
	AddLog(e log.Entry) error

	GetTemplate(id string) (snd.Template, error)
	SaveTemplate(template snd.Template) error
	DeleteTemplate(id string) error
	GetTemplates() ([]TemplateEntry, error)

	GetEntries(id string) ([]snd.Entry, error)
	GetEntry(id string, eid string) (snd.Entry, error)
	CountEntries(id string) (int, error)
	SaveEntry(id string, entry snd.Entry) error
	SaveEntries(id string, entry []snd.Entry) error
	DeleteEntry(id string, eid string) error
	DeleteEntries(id string) error

	GetGenerator(id string) (snd.Generator, error)
	SaveGenerator(generator snd.Generator) error
	DeleteGenerator(id string) error
	GetGenerators() ([]snd.Generator, error)

	SaveSource(ds snd.DataSource) error
	DeleteSource(id string) error
	GetSource(id string) (snd.DataSource, error)
	GetSources() ([]DataSourceEntry, error)
}
