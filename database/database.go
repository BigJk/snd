package database

import (
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
)

type TemplateEntry struct {
	snd.Template
	Count int `json:"count"`
}

type DataSourceEntry struct {
	snd.DataSource
	Count int `json:"count"`
}

type Database interface {
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
	DeleteEntry(id string, eid string) error
	DeleteEntries(id string) error

	SaveSource(ds snd.DataSource) error
	DeleteSource(id string) error
	GetSource(id string) (snd.DataSource, error)
	GetSources() ([]DataSourceEntry, error)

	SaveScript(s snd.Script) error
	DeleteScript(id string) error
	GetScripts() ([]snd.Script, error)
	GetScript(id string) (snd.Script, error)
}
