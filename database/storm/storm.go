package storm

import (
	"bytes"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/asdine/storm"
	"go.etcd.io/bbolt"
	"time"
)

const (
	BucketBase      = "BASE"
	BucketTemplates = "TEMPLATES"
	BucketSources   = "DATA_SOURCES"
	BucketEntries   = "ENTRIES"
	BucketScripts   = "SCRIPTS"

	KeySettings = "SETTINGS"
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
	return fetchSingle[snd.Settings](s.db, BucketBase, KeySettings)
}

func (s *Storm) SaveSettings(settings snd.Settings) error {
	return s.db.Set(BucketBase, KeySettings, &settings)
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

func (s *Storm) GetTemplate(id string) (snd.Template, error) {
	return fetchSingle[snd.Template](s.db, BucketTemplates, id)
}

func (s *Storm) SaveTemplate(template snd.Template) error {
	return s.db.Set(BucketTemplates, template.ID(), &template)
}

func (s *Storm) DeleteTemplate(id string) error {
	return s.db.Delete(BucketTemplates, id)
}

func (s *Storm) GetTemplates() ([]database.TemplateEntry, error) {
	templates, err := fetchFromBucket[database.TemplateEntry](s.db, "", BucketTemplates)
	if err != nil {
		return nil, err
	}

	for i := range templates {
		sum, _ := s.CountEntries(templates[i].ID())

		for j := range templates[i].DataSources {
			c, _ := s.CountEntries(templates[i].DataSources[j])
			sum += c
		}

		templates[i].Count = sum
	}

	return templates, err
}

func (s *Storm) GetEntries(id string) ([]snd.Entry, error) {
	return fetchFromBucket[snd.Entry](s.db, id, BucketEntries)
}

func (s *Storm) GetEntry(id string, eid string) (snd.Entry, error) {
	return fetchSingle[snd.Entry](s.db, BucketEntries, eid, id)
}

func (s *Storm) CountEntries(id string) (int, error) {
	return countFromBucket(s.db, id, BucketEntries)
}

func (s *Storm) SaveEntry(id string, entry snd.Entry) error {
	return s.db.From(id).Set(BucketEntries, entry.ID, &entry)
}

func (s *Storm) DeleteEntry(id string, eid string) error {
	return s.db.From(id).Delete(BucketEntries, eid)
}

func (s *Storm) DeleteEntries(id string) error {
	return s.db.Bolt.Update(func(tx *bbolt.Tx) error {
		b := s.db.From(id).GetBucket(tx)
		if b == nil {
			return nil
		}
		return b.DeleteBucket([]byte(BucketEntries))
	})
}

func (s *Storm) SaveSource(ds snd.DataSource) error {
	return s.db.Set(BucketSources, ds.ID(), ds)
}

func (s *Storm) DeleteSource(id string) error {
	return s.db.Delete(BucketSources, id)
}

func (s *Storm) GetSource(id string) (snd.DataSource, error) {
	return fetchSingle[snd.DataSource](s.db, BucketSources, id)
}

func (s *Storm) GetSources() ([]database.DataSourceEntry, error) {
	sources, err := fetchFromBucket[database.DataSourceEntry](s.db, "", BucketSources)
	if err != nil {
		return nil, err
	}

	for i := range sources {
		c, err := s.CountEntries(sources[i].ID())
		if err != nil {
			return nil, err
		}
		sources[i].Count = c
	}

	return sources, nil
}
