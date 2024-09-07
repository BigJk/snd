package imexport

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"

	"github.com/BigJk/snd"
)

type templateMeta struct {
	Name            string               `json:"name"`
	Slug            string               `json:"slug"`
	Author          string               `json:"author"`
	Description     string               `json:"description"`
	CopyrightNotice string               `json:"copyrightNotice"`
	DataSources     []string             `json:"dataSources"`
	Config          []snd.TemplateConfig `json:"config"`
	Images          map[string]string    `json:"images"`
}

func writeMeta(writer io.Writer, tmpl snd.Template) error {
	enc := json.NewEncoder(writer)
	enc.SetIndent("", "\t")
	enc.SetEscapeHTML(true)
	if err := enc.Encode(&templateMeta{
		tmpl.Name, tmpl.Slug, tmpl.Author, tmpl.Description, tmpl.CopyrightNotice, tmpl.DataSources, tmpl.Config, tmpl.Images,
	}); err != nil {
		return err
	}
	return nil
}

func writeSkeleton(writer io.Writer, tmpl snd.Template) error {
	enc := json.NewEncoder(writer)
	enc.SetIndent("", "\t")
	enc.SetEscapeHTML(true)
	if err := enc.Encode(&tmpl.SkeletonData); err != nil {
		return err
	}
	return nil
}

func writeEntries(writer io.Writer, entries []snd.Entry) error {
	enc := json.NewEncoder(writer)
	enc.SetIndent("", "\t")
	enc.SetEscapeHTML(true)
	if err := enc.Encode(&entries); err != nil {
		return err
	}
	return nil
}

// ImportTemplate imports a template from a given ImportReader interface instance.
//
// Following files are needed:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
func ImportTemplate(reader ImportReader) (snd.Template, []snd.Entry, error) {
	var tmpl snd.Template
	var entries []snd.Entry

	files, err := readFiles(reader, []string{"meta.json", "print.html.njk", "list.html.njk", "skeleton.json", "entries.json"})
	if err != nil {
		return snd.Template{}, nil, err
	}

	// meta data
	var meta templateMeta
	if err := json.Unmarshal(files["meta.json"], &meta); err != nil {
		return snd.Template{}, nil, err
	}

	tmpl = snd.Template{
		Name:            meta.Name,
		Slug:            meta.Slug,
		Author:          meta.Author,
		Description:     meta.Description,
		CopyrightNotice: meta.CopyrightNotice,
		PrintTemplate:   "",
		ListTemplate:    "",
		SkeletonData:    nil,
		Images:          meta.Images,
		Config:          meta.Config,
		DataSources:     meta.DataSources,
		Version:         "",
	}

	if len(tmpl.Slug) == 0 || len(tmpl.Author) == 0 || len(tmpl.Name) == 0 {
		return snd.Template{}, nil, errors.New("meta data incomplete (e.g. name, author, slug missing)")
	}

	if !validChars.MatchString(tmpl.Slug) || !validChars.MatchString(tmpl.Author) {
		return snd.Template{}, nil, errors.New("slug or author contains illegal characters")
	}

	tmpl.PrintTemplate = string(files["print.html.njk"])
	tmpl.ListTemplate = string(files["list.html.njk"])

	// skeleton
	if err := json.Unmarshal(files["skeleton.json"], &tmpl.SkeletonData); err != nil {
		return snd.Template{}, nil, err
	}

	// entries
	if err := json.Unmarshal(files["entries.json"], &entries); err != nil {
		return snd.Template{}, nil, err
	}

	return tmpl, entries, nil
}

// ExportTemplate exports a template to a given ExportWriter interface instance.
//
// Following files will be created:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
func ExportTemplate(tmpl snd.Template, entries []snd.Entry, writer ExportWriter) error {
	metaData := &bytes.Buffer{}
	skeletonData := &bytes.Buffer{}
	entriesData := &bytes.Buffer{}

	if err := writeMeta(metaData, tmpl); err != nil {
		return nil
	}

	if err := writeSkeleton(skeletonData, tmpl); err != nil {
		return nil
	}

	if err := writeEntries(entriesData, entries); err != nil {
		return nil
	}

	return writeFiles(writer, map[string][]byte{
		"meta.json":      metaData.Bytes(),
		"skeleton.json":  skeletonData.Bytes(),
		"entries.json":   entriesData.Bytes(),
		"print.html.njk": []byte(tmpl.PrintTemplate),
		"list.html.njk":  []byte(tmpl.ListTemplate),
	})
}
