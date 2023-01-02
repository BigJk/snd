package imexport

import (
	"encoding/json"
	"fmt"

	"github.com/BigJk/snd"
)

type JSONImportReader struct {
	json string
}

type JSONFolder struct {
	Files map[string]string `json:"files"`
	Name  string            `json:"name"`
}

func (f *JSONImportReader) ReadFile(name string) ([]byte, error) {
	if !json.Valid([]byte(f.json)) {
		return nil, &json.SyntaxError{}
	}

	var result JSONFolder
	json.Unmarshal([]byte(f.json), &result)

	return []byte(result.Files[name]), nil
}

type JSONExportWriter struct {
	Files map[string]string `json:"files"`
	Name  string            `json:"name"`
}

func (f *JSONExportWriter) WriteFile(file string, data []byte) error {
	f.Files[file] = string(data)
	return nil
}

func ExportTemplateJSON(tmpl snd.Template, entries []snd.Entry) ([]byte, error) {
	name := fmt.Sprintf("%s_%s", tmpl.Author, tmpl.Slug)
	writer := &JSONExportWriter{Name: name, Files: make(map[string]string)}

	err := ExportTemplate(tmpl, entries, writer)
	if err != nil {
		return []byte{}, err
	}

	json, err := json.Marshal(writer)
	if err != nil {
		return []byte{}, err
	}

	return json, nil
}

func ImportTemplateJSON(s string) (snd.Template, []snd.Entry, error) {
	reader := &JSONImportReader{
		json: s,
	}
	return ImportTemplate(reader)
}

func ImportSourceJSON(s string) (snd.DataSource, []snd.Entry, error) {
	reader := &JSONImportReader{
		json: s,
	}
	return ImportSource(reader)
}

func ExportSourceJSON(ds snd.DataSource, entries []snd.Entry) ([]byte, error) {
	name := fmt.Sprintf("ds_%s_%s", ds.Author, ds.Slug)
	writer := &JSONExportWriter{Name: name, Files: make(map[string]string)}

	err := ExportSource(ds, entries, writer)
	if err != nil {
		return []byte{}, err
	}

	json, err := json.Marshal(writer)
	if err != nil {
		return []byte{}, err
	}
	return json, nil
}

func ExportGeneratorJSON(gen snd.Generator) ([]byte, error) {
	name := fmt.Sprintf("gen_%s_%s", gen.Author, gen.Slug)
	writer := &JSONExportWriter{Name: name, Files: make(map[string]string)}

	err := ExportGenerator(gen, writer)
	if err != nil {
		return []byte{}, err
	}

	json, err := json.Marshal(writer)
	if err != nil {
		return []byte{}, err
	}
	return json, nil
}

func ImportGeneratorJSON(s string) (snd.Generator, error) {
	reader := &JSONImportReader{
		json: s,
	}
	return ImportGenerator(reader)
}
