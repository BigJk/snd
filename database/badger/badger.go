package badger

import (
	"fmt"
	"strings"
	"time"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/dgraph-io/badger/v3"
)

const (
	SettingsKey    = "SETTINGS"
	EntryConnector = "##ENT_"
)

type Badger struct {
	db *badger.DB
}

func New(folder string) (*Badger, error) {
	db, err := badger.Open(badger.DefaultOptions(folder).WithValueLogFileSize(30_000_000).WithCompactL0OnClose(true))
	if err != nil {
		return nil, err
	}

	// GC Timer
	go func() {
		ticker := time.NewTicker(time.Minute * 5)
		defer ticker.Stop()

		for range ticker.C {
		again:
			if db.IsClosed() {
				return
			}

			err := db.RunValueLogGC(0.7)
			if err == nil {
				goto again
			}
		}
	}()

	// Sync Timer
	go func() {
		ticker := time.NewTicker(time.Second * 10)
		defer ticker.Stop()

		for range ticker.C {
			if db.IsClosed() {
				return
			}

			_ = db.Sync()
		}
	}()

	return &Badger{db: db}, nil
}

func (b *Badger) Close() error {
	return b.db.Close()
}

func (b *Badger) Sync() error {
	return b.db.Sync()
}

func (b *Badger) GetSettings() (snd.Settings, error) {
	return fetchSingle[snd.Settings](b.db, SettingsKey)
}

func (b *Badger) SaveSettings(settings snd.Settings) error {
	return setSingle[snd.Settings](b.db, SettingsKey, settings)
}

func (b *Badger) GetLogs(hours int) ([]log.Entry, error) {
	// TODO: implement this
	return nil, nil
}

func (b *Badger) AddLog(e log.Entry) error {
	return setSingle[log.Entry](b.db, fmt.Sprintf("log:%d", e.Time.Unix()), e)
}

func (b *Badger) GetTemplate(id string) (snd.Template, error) {
	return fetchSingle[snd.Template](b.db, id)
}

func (b *Badger) SaveTemplate(template snd.Template) error {
	return setSingle[snd.Template](b.db, template.ID(), template)
}

func (b *Badger) DeleteTemplate(id string) error {
	if err := b.DeleteEntries(id); err != nil {
		return err
	}

	return dropSingle(b.db, id)
}

func (b *Badger) GetTemplates() ([]database.TemplateEntry, error) {
	templates, err := fetchAll[database.TemplateEntry](b.db, "tmpl:", func(s string) bool {
		return !strings.Contains(s, EntryConnector)
	})
	if err != nil {
		return nil, err
	}

	for i := range templates {
		sum, _ := b.CountEntries(templates[i].ID())

		for j := range templates[i].DataSources {
			c, _ := b.CountEntries(templates[i].DataSources[j])
			sum += c
		}

		templates[i].Count = sum
	}

	return templates, err
}

func (b *Badger) GetEntries(id string) ([]snd.Entry, error) {
	return fetchAll[snd.Entry](b.db, id+EntryConnector, nil)
}

func (b *Badger) GetEntry(id string, eid string) (snd.Entry, error) {
	return fetchSingle[snd.Entry](b.db, id+EntryConnector+eid)
}

func (b *Badger) CountEntries(id string) (int, error) {
	return countAll(b.db, id+EntryConnector, nil)
}

func (b *Badger) SaveEntry(id string, entry snd.Entry) error {
	return setSingle[snd.Entry](b.db, id+EntryConnector+entry.ID, entry)
}

func (b *Badger) SaveEntries(id string, entries []snd.Entry) error {
	for i := range entries {
		if err := setSingle[snd.Entry](b.db, id+EntryConnector+entries[i].ID, entries[i]); err != nil {
			return err
		}
	}
	return nil
}

func (b *Badger) DeleteEntry(id string, eid string) error {
	return dropSingle(b.db, id+EntryConnector+eid)
}

func (b *Badger) DeleteEntries(id string) error {
	return dropAll(b.db, id+EntryConnector)
}

func (b *Badger) GetGenerator(id string) (snd.Generator, error) {
	return fetchSingle[snd.Generator](b.db, id)
}

func (b *Badger) SaveGenerator(generator snd.Generator) error {
	return setSingle[snd.Generator](b.db, generator.ID(), generator)
}

func (b *Badger) DeleteGenerator(id string) error {
	if err := b.DeleteEntries(id); err != nil {
		return err
	}

	return dropSingle(b.db, id)
}

func (b *Badger) GetGenerators() ([]snd.Generator, error) {
	return fetchAll[snd.Generator](b.db, "gen:", nil)
}

func (b *Badger) SaveSource(ds snd.DataSource) error {
	return setSingle[snd.DataSource](b.db, ds.ID(), ds)
}

func (b *Badger) DeleteSource(id string) error {
	if err := b.DeleteEntries(id); err != nil {
		return err
	}

	return dropSingle(b.db, id)
}

func (b *Badger) GetSource(id string) (snd.DataSource, error) {
	return fetchSingle[snd.DataSource](b.db, id)
}

func (b *Badger) GetSources() ([]database.DataSourceEntry, error) {
	sources, err := fetchAll[database.DataSourceEntry](b.db, "ds:", func(s string) bool {
		return !strings.Contains(s, EntryConnector)
	})
	if err != nil {
		return nil, err
	}

	for i := range sources {
		c, err := b.CountEntries(sources[i].ID())
		if err != nil {
			return nil, err
		}
		sources[i].Count = c
	}

	return sources, nil
}

func (b *Badger) GetKey(key string) (string, error) {
	var value string
	err := b.db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte("KV_" + key))
		if err != nil {
			return err
		}
		return item.Value(func(val []byte) error {
			value = string(val)
			return nil
		})
	})
	return value, err
}

func (b *Badger) SetKey(key string, value string) error {
	return b.db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("KV_"+key), []byte(value))
	})
}

func (b *Badger) DeleteKey(key string) error {
	return dropSingle(b.db, "KV_"+key)
}

func (b *Badger) GetKeysPrefix(prefix string) ([]string, error) {
	var keys []string
	err := b.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchSize = 10
		it := txn.NewIterator(opts)
		defer it.Close()

		prefix := []byte("KV_" + prefix)
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			item := it.Item()
			k := item.Key()
			keys = append(keys, strings.TrimPrefix(string(k), "KV_"))
		}
		return nil
	})
	return keys, err
}
