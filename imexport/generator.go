package imexport

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"

	"github.com/BigJk/snd"
)

type generatorMeta struct {
	Name            string                `json:"name"`
	Slug            string                `json:"slug"`
	Author          string                `json:"author"`
	Description     string                `json:"description"`
	CopyrightNotice string                `json:"copyrightNotice"`
	PassEntriesToJS bool                  `json:"passEntriesToJS"`
	Config          []snd.GeneratorConfig `json:"config"`
	Images          map[string]string     `json:"images"`
	DataSources     []string              `json:"dataSources"`
	Version         string                `json:"version"`
}

func writeGenMeta(writer io.Writer, gen snd.Generator) error {
	enc := json.NewEncoder(writer)
	enc.SetIndent("", "\t")
	enc.SetEscapeHTML(true)
	if err := enc.Encode(&generatorMeta{
		Name:            gen.Name,
		Slug:            gen.Slug,
		Author:          gen.Author,
		Description:     gen.Description,
		CopyrightNotice: gen.CopyrightNotice,
		PassEntriesToJS: gen.PassEntriesToJS,
		Config:          gen.Config,
		Images:          gen.Images,
		DataSources:     gen.DataSources,
		Version:         gen.Version,
	}); err != nil {
		return err
	}
	return nil
}

// ImportGenerator imports a generator from a given ImportReader interface instance.
//
// Following files are needed:
// - meta.json
// - print.html.njk
func ImportGenerator(reader ImportReader) (snd.Generator, error) {
	files, err := readFiles(reader, []string{"meta.json", "print.html.njk"})
	if err != nil {
		return snd.Generator{}, err
	}

	var gen snd.Generator
	if err := json.Unmarshal(files["meta.json"], &gen); err != nil {
		return snd.Generator{}, err
	}

	gen.PrintTemplate = string(files["print.html.njk"])

	if len(gen.Slug) == 0 || len(gen.Author) == 0 || len(gen.Name) == 0 {
		return snd.Generator{}, errors.New("meta data incomplete (e.g. name, author, slug missing)")
	}

	if !validChars.MatchString(gen.Slug) || !validChars.MatchString(gen.Author) {
		return snd.Generator{}, errors.New("slug or author contains illegal characters")
	}

	return gen, nil
}

// ExportGenerator exports a template to a given ExportWriter interface instance.
//
// Following files will be created:
// - meta.json
// - list.html.njk
func ExportGenerator(gen snd.Generator, writer ExportWriter) error {
	metaData := &bytes.Buffer{}

	if err := writeGenMeta(metaData, gen); err != nil {
		return nil
	}

	return writeFiles(writer, map[string][]byte{
		"meta.json":      metaData.Bytes(),
		"print.html.njk": []byte(gen.PrintTemplate),
	})
}
