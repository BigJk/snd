package memory

import (
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
)

type Memory struct {
	settings   snd.Settings
	templates  map[string]snd.Template
	entries    map[string]map[string]snd.Entry
	generators map[string]snd.Generator
	sources    map[string]snd.DataSource
	kv         map[string]string
}

func New() *Memory {
	return &Memory{
		templates:  map[string]snd.Template{},
		entries:    map[string]map[string]snd.Entry{},
		generators: map[string]snd.Generator{},
		sources:    map[string]snd.DataSource{},
	}
}

func (m *Memory) Close() error {
	return nil
}

func (m *Memory) GetSettings() (snd.Settings, error) {
	return m.settings, nil
}

func (m *Memory) SaveSettings(settings snd.Settings) error {
	m.settings = settings
	return nil
}

func (m *Memory) GetLogs(hours int) ([]log.Entry, error) {
	return nil, nil
}

func (m *Memory) AddLog(e log.Entry) error {
	return nil
}

func (m *Memory) GetTemplate(id string) (snd.Template, error) {
	return m.templates[id], nil
}

func (m *Memory) SaveTemplate(template snd.Template) error {
	m.templates[template.ID()] = template
	return nil
}

func (m *Memory) DeleteTemplate(id string) error {
	delete(m.templates, id)
	return nil
}

func (m *Memory) GetTemplates() ([]database.TemplateEntry, error) {
	var templates []database.TemplateEntry
	for _, t := range m.templates {
		templates = append(templates, database.TemplateEntry{
			Template: t,
			Count:    len(m.entries[t.ID()]),
		})
	}
	return templates, nil
}

func (m *Memory) GetEntries(id string) ([]snd.Entry, error) {
	entries := make([]snd.Entry, 0)
	for _, e := range m.entries[id] {
		entries = append(entries, e)
	}
	return entries, nil
}

func (m *Memory) GetEntry(id string, eid string) (snd.Entry, error) {
	return m.entries[id][eid], nil
}

func (m *Memory) CountEntries(id string) (int, error) {
	return len(m.entries[id]), nil
}

func (m *Memory) SaveEntry(id string, entry snd.Entry) error {
	if m.entries[id] == nil {
		m.entries[id] = map[string]snd.Entry{}
	}
	m.entries[id][entry.ID] = entry
	return nil
}

func (m *Memory) SaveEntries(id string, entry []snd.Entry) error {
	for _, e := range entry {
		if m.entries[id] == nil {
			m.entries[id] = map[string]snd.Entry{}
		}
		m.entries[id][e.ID] = e
	}
	return nil
}

func (m *Memory) DeleteEntry(id string, eid string) error {
	delete(m.entries[id], eid)
	return nil
}

func (m *Memory) DeleteEntries(id string) error {
	delete(m.entries, id)
	return nil
}

func (m *Memory) GetGenerator(id string) (snd.Generator, error) {
	return m.generators[id], nil
}

func (m *Memory) SaveGenerator(generator snd.Generator) error {
	m.generators[generator.ID()] = generator
	return nil
}

func (m *Memory) DeleteGenerator(id string) error {
	delete(m.generators, id)
	return nil
}

func (m *Memory) GetGenerators() ([]snd.Generator, error) {
	var generators []snd.Generator
	for _, g := range m.generators {
		generators = append(generators, g)
	}
	return generators, nil
}

func (m *Memory) SaveSource(ds snd.DataSource) error {
	m.sources[ds.ID()] = ds
	return nil
}

func (m *Memory) DeleteSource(id string) error {
	delete(m.sources, id)
	return nil
}

func (m *Memory) GetSource(id string) (snd.DataSource, error) {
	return m.sources[id], nil
}

func (m *Memory) GetSources() ([]database.DataSourceEntry, error) {
	var sources []database.DataSourceEntry
	for _, s := range m.sources {
		sources = append(sources, database.DataSourceEntry{
			DataSource: s,
			Count:      len(m.entries[s.ID()]),
		})
	}
	return sources, nil
}

func (m *Memory) GetKey(key string) (string, error) {
	return m.kv[key], nil
}

func (m *Memory) SetKey(key string, value string) error {
	m.kv[key] = value
	return nil
}

func (m *Memory) DeleteKey(key string) error {
	delete(m.kv, key)
	return nil
}

func (m *Memory) GetKeysPrefix(prefix string) ([]string, error) {
	var keys []string
	for k := range m.kv {
		if len(prefix) > len(k) {
			continue
		}
		if k[:len(prefix)] == prefix {
			keys = append(keys, k)
		}
	}
	return keys, nil
}
