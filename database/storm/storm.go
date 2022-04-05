package storm

import (
	"bytes"
	"fmt"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/asdine/storm"
	"github.com/asdine/storm/q"
	"go.etcd.io/bbolt"
	"time"
)

type Storm struct {
	db *storm.DB
}

func New(file string) (*Storm, error) {
	db, err := storm.Open(file)
	if err != nil {
		return nil, err
	}

	return &Storm{db: db}, nil
}

func (s *Storm) DB() *storm.DB {
	return s.db
}

func (s *Storm) GetSettings() (snd.Settings, error) {
	var settings snd.Settings
	if err := s.db.Get("base", "settings", &settings); err != nil {
		return snd.Settings{}, err
	}
	return settings, nil
}

func (s *Storm) SaveSettings(settings snd.Settings) error {
	return s.db.Set("base", "settings", &s)
}

func (s *Storm) GetLogs(hours int) ([]log.Entry, error) {
	var logs []log.Entry

	_ = s.db.Bolt.View(func(tx *bbolt.Tx) error {
		c := tx.Bucket([]byte("logs")).Cursor()

		// From -hours to now
		min := []byte(time.Now().Add(time.Hour * -1 * time.Duration(hours)).Format(time.RFC3339))
		max := []byte(time.Now().Add(time.Hour).Format(time.RFC3339))

		for k, v := c.Seek(min); k != nil && bytes.Compare(k, max) <= 0; k, v = c.Next() {
			var e log.Entry
			if err := s.db.Codec().Unmarshal(v, &e); err != nil {
				_ = log.ErrorString("error while unmarshal of log entry", log.WithValue("err", err))
			} else {
				logs = append(logs, e)
			}
		}

		return nil
	})

	return logs, nil
}

func (s *Storm) AddLog(e log.Entry) error {
	return s.db.Set("logs", e.Time.Format(time.RFC3339), &e)
}

func (s *Storm) GetEntries(id int, page int, search string) ([]snd.Entry, error) {
	var entries []snd.Entry

	if len(search) == 0 {
		if err := s.db.From(fmt.Sprint(id)).Select().Skip(page * 50).Limit(50).Find(&entries); err != nil && err != storm.ErrNotFound {
			return nil, err
		}
	} else {
		if err := s.db.From(fmt.Sprint(id)).Select(q.Re("Data", "(?i)"+search)).Skip(page * 50).Limit(50).Find(&entries); err != nil && err != storm.ErrNotFound {
			return nil, err
		}
	}

	return entries, nil
}

func (s *Storm) GetEntriesPages(id int, search string) (int, error) {
	var c int
	var err error

	if len(search) == 0 {
		if c, err = s.db.From(fmt.Sprint(id)).Select().Count(&snd.Entry{}); err != nil && err != storm.ErrNotFound {
			return 0, err
		}
	} else {
		if c, err = s.db.From(fmt.Sprint(id)).Select(q.Re("Data", "(?i)"+search)).Count(&snd.Entry{}); err != nil && err != storm.ErrNotFound {
			return 0, err
		}
	}

	return (c / 50) + 1, nil
}

func (s *Storm) SaveEntry(id int, e snd.Entry) error {
	return s.db.From(fmt.Sprint(id)).Save(&e)
}

func (s *Storm) DeleteEntry(id int, eid int) error {
	return s.db.From(fmt.Sprint(id)).DeleteStruct(&snd.Entry{ID: eid})
}

func (s *Storm) GetEntry(id int, eid int) (snd.Entry, error) {
	var entry snd.Entry
	if err := s.db.From(fmt.Sprint(id)).One("ID", eid, &entry); err != nil {
		return snd.Entry{}, err
	}

	return entry, nil
}

func (s *Storm) SaveTemplate(t snd.Template) error {
	return s.db.Save(&t)
}

func (s *Storm) DeleteTemplate(id int) error {
	return s.db.DeleteStruct(&snd.Template{ID: id})
}

func (s *Storm) GetTemplates() ([]database.TemplateEntry, error) {
	var templates []snd.Template
	if err := s.db.All(&templates); err != nil && err != storm.ErrNotFound {
		return nil, err
	}

	var templateListings []database.TemplateEntry
	for i := range templates {
		c, _ := s.db.From(fmt.Sprint(templates[i].ID)).Count(&snd.Entry{})

		templateListings = append(templateListings, database.TemplateEntry{
			Template: templates[i],
			Count:    c,
		})
	}

	return templateListings, nil
}

func (s *Storm) GetTemplate(id int) (snd.Template, error) {
	var template snd.Template
	if err := s.db.One("ID", id, &template); err != nil {
		return snd.Template{}, err
	}

	return template, nil
}

func (s *Storm) SaveScript(script snd.Script) error {
	return s.db.Save(&script)
}

func (s *Storm) DeleteScript(id int) error {
	return s.db.DeleteStruct(&snd.Script{ID: id})
}

func (s *Storm) GetScripts() ([]snd.Script, error) {
	var scripts []snd.Script
	if err := s.db.All(&scripts); err != nil && err != storm.ErrNotFound {
		return nil, err
	}

	return scripts, nil
}

func (s *Storm) GetScript(id int) (snd.Script, error) {
	var script snd.Script
	if err := s.db.One("ID", id, &script); err != nil {
		return snd.Script{}, err
	}

	return script, nil
}
