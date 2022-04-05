package database

import (
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
)

type TemplateEntry struct {
	snd.Template
	Count int `json:"count"`
}

type Database interface {
	GetSettings() (snd.Settings, error)
	SaveSettings(settings snd.Settings) error

	GetLogs(hours int) ([]log.Entry, error)
	AddLog(e log.Entry) error

	GetEntries(id int, page int, search string) ([]snd.Entry, error)
	GetEntriesPages(id int, search string) (int, error)
	SaveEntry(id int, e snd.Entry) error
	DeleteEntry(id int, eid int) error
	GetEntry(id int, eid int) (snd.Entry, error)

	SaveTemplate(t snd.Template) error
	DeleteTemplate(id int) error
	GetTemplates() ([]TemplateEntry, error)
	GetTemplate(id int) (snd.Template, error)

	SaveScript(s snd.Script) error
	DeleteScript(id int) error
	GetScripts() ([]snd.Script, error)
	GetScript(id int) (snd.Script, error)
}
