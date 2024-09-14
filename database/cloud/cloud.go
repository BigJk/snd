package cloud

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
)

type Cloud struct {
	client  http.Client
	baseUrl string
	key     string
	localDb database.Database
}

func CheckKey(baseUrl string, key string) error {
	client := http.Client{
		Timeout: time.Second * 10,
	}

	resp, err := client.Get(baseUrl + "/key/" + key)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("invalid key")
	}

	return nil
}

func New(baseUrl string, key string, localDb database.Database) *Cloud {
	return &Cloud{
		client: http.Client{
			Timeout: time.Second * 10,
		},
		baseUrl: baseUrl,
		key:     key,
		localDb: localDb,
	}
}

func (c *Cloud) CopyFromLocal() error {
	return database.Migrate(c.localDb, c)
}

func (c *Cloud) CopyToLocal() error {
	return database.Migrate(c, c.localDb)
}

func (c *Cloud) request(method string, path string, body interface{}, result interface{}) (int, error) {
	route, err := url.Parse(c.baseUrl + path)
	if err != nil {
		return -1, err
	}

	req := http.Request{
		Method: method,
		URL:    route,
		Header: http.Header{
			"Authorization": []string{c.key},
			"Content-Type":  []string{"application/json"},
		},
	}

	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return -1, err
		}
		req.Body = io.NopCloser(bytes.NewBuffer(jsonData))
	}

	resp, err := c.client.Do(&req)
	if err != nil {
		return -1, err
	}

	if resp.StatusCode != http.StatusOK {
		return resp.StatusCode, nil
	}

	if result != nil {
		err = json.NewDecoder(resp.Body).Decode(result)
		if err != nil {
			return resp.StatusCode, err
		}
	}

	return resp.StatusCode, nil
}

func (c *Cloud) requestNoStatus(method string, path string, body interface{}, result interface{}) error {
	_, err := c.request(method, path, body, result)
	return err
}

func (c *Cloud) Close() error {
	return c.localDb.Close()
}

func (c *Cloud) GetSettings() (snd.Settings, error) {
	return c.localDb.GetSettings()
}

func (c *Cloud) SaveSettings(settings snd.Settings) error {
	return c.localDb.SaveSettings(settings)
}

func (c *Cloud) GetLogs(hours int) ([]log.Entry, error) {
	return c.localDb.GetLogs(hours)
}

func (c *Cloud) AddLog(e log.Entry) error {
	return c.localDb.AddLog(e)
}

func (c *Cloud) GetTemplate(id string) (snd.Template, error) {
	var template snd.Template
	_, err := c.request(http.MethodGet, "/api/template/"+id, nil, &template)
	return template, err
}

func (c *Cloud) SaveTemplate(template snd.Template) error {
	return c.requestNoStatus(http.MethodPost, "/api/template", template, nil)
}

func (c *Cloud) DeleteTemplate(id string) error {
	return c.requestNoStatus(http.MethodDelete, "/api/template/"+id, nil, nil)
}

func (c *Cloud) GetTemplates() ([]database.TemplateEntry, error) {
	var templates []database.TemplateEntry
	_, err := c.request(http.MethodGet, "/api/templates", nil, &templates)
	return templates, err
}

func (c *Cloud) GetEntries(id string) ([]snd.Entry, error) {
	var entries []snd.Entry
	_, err := c.request(http.MethodGet, "/api/entries/"+id, nil, &entries)
	return entries, err
}

func (c *Cloud) GetEntry(id string, eid string) (snd.Entry, error) {
	var entry snd.Entry
	_, err := c.request(http.MethodGet, "/api/entry/"+id+"/"+eid, nil, &entry)
	return entry, err
}

func (c *Cloud) CountEntries(id string) (int, error) {
	var count int
	_, err := c.request(http.MethodGet, "/api/entries/"+id+"/count", nil, &count)
	return count, err
}

func (c *Cloud) SaveEntry(id string, entry snd.Entry) error {
	return c.requestNoStatus(http.MethodPost, "/api/entry/"+id, entry, nil)
}

func (c *Cloud) SaveEntries(id string, entries []snd.Entry) error {
	return c.requestNoStatus(http.MethodPost, "/api/entries/"+id, entries, nil)
}

func (c *Cloud) DeleteEntry(id string, eid string) error {
	return c.requestNoStatus(http.MethodDelete, "/api/entry/"+id+"/"+eid, nil, nil)
}

func (c *Cloud) DeleteEntries(id string) error {
	return c.requestNoStatus(http.MethodDelete, "/api/entries/"+id, nil, nil)
}

func (c *Cloud) GetGenerator(id string) (snd.Generator, error) {
	var generator snd.Generator
	_, err := c.request(http.MethodGet, "/api/generator/"+id, nil, &generator)
	return generator, err
}

func (c *Cloud) SaveGenerator(generator snd.Generator) error {
	return c.requestNoStatus(http.MethodPost, "/api/generator", generator, nil)
}

func (c *Cloud) DeleteGenerator(id string) error {
	return c.requestNoStatus(http.MethodDelete, "/api/generator/"+id, nil, nil)
}

func (c *Cloud) GetGenerators() ([]snd.Generator, error) {
	var generators []snd.Generator
	_, err := c.request(http.MethodGet, "/api/generators", nil, &generators)
	return generators, err
}

func (c *Cloud) SaveSource(ds snd.DataSource) error {
	return c.requestNoStatus(http.MethodPost, "/api/source/", ds, nil)
}

func (c *Cloud) DeleteSource(id string) error {
	return c.requestNoStatus(http.MethodDelete, "/api/source/"+id, nil, nil)
}

func (c *Cloud) GetSource(id string) (snd.DataSource, error) {
	var ds snd.DataSource
	_, err := c.request(http.MethodGet, "/api/source/"+id, nil, &ds)
	return ds, err
}

func (c *Cloud) GetSources() ([]database.DataSourceEntry, error) {
	var sources []database.DataSourceEntry
	_, err := c.request(http.MethodGet, "/api/sources", nil, &sources)
	return sources, err
}

func (c *Cloud) GetKey(key string) (string, error) {
	return "", errors.New("not implemented")
}

func (c *Cloud) SetKey(key string, value string) error {
	return errors.New("not implemented")
}

func (c *Cloud) DeleteKey(key string) error {
	return errors.New("not implemented")
}

func (c *Cloud) GetKeysPrefix(prefix string) ([]string, error) {
	return nil, errors.New("not implemented")
}
