package imexport

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/BigJk/snd"
)

type FolderImportReader struct {
	base string
}

func (f *FolderImportReader) ReadFile(s string) ([]byte, error) {
	data, err := ioutil.ReadFile(filepath.Join(f.base, s))
	if err != nil {
		return nil, err
	}
	return data, nil
}

type FolderExportWriter struct {
	base string
}

func (f *FolderExportWriter) WriteFile(file string, data []byte) error {
	return ioutil.WriteFile(filepath.Join(f.base, file), data, 0666)
}

// ExportTemplateFolder exports the template and entries to the given folder. A new folder with
// the pattern {tmpl.Autor}_{tmpl.Slug} will be created.
//
// Following files will be created:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
//
// The function returns the name of the created folder.
func ExportTemplateFolder(tmpl snd.Template, entries []snd.Entry, folder string) (string, error) {
	name := fmt.Sprintf("%s_%s", tmpl.Author, tmpl.Slug)
	_ = os.MkdirAll(filepath.Join(folder, name), 0777)

	return name, ExportTemplate(tmpl, entries, &FolderExportWriter{base: filepath.Join(folder, name)})
}

// ImportTemplateFolder will import template and entry data from a given folder.
//
// Following files are needed:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
func ImportTemplateFolder(folder string) (snd.Template, []snd.Entry, error) {
	reader := &FolderImportReader{
		base: folder,
	}
	return ImportTemplate(reader)
}

// ImportSourceFolder will import data source and entry data from a given folder.
//
// Following files are needed:
// - meta.json
// - entries.json
func ImportSourceFolder(folder string) (snd.DataSource, []snd.Entry, error) {
	reader := &FolderImportReader{
		base: folder,
	}
	return ImportSource(reader)
}

// ExportGeneratorFolder exports the template and entries to the given folder. A new folder with
// the pattern gen_{tmpl.Autor}_{tmpl.Slug} will be created.
//
// Following files will be created:
// - meta.json
// - print.html.njk
//
// The function returns the name of the created folder.
func ExportGeneratorFolder(tmpl snd.Generator, folder string) (string, error) {
	name := fmt.Sprintf("gen_%s_%s", tmpl.Author, tmpl.Slug)
	_ = os.MkdirAll(filepath.Join(folder, name), 0777)

	return name, ExportGenerator(tmpl, &FolderExportWriter{base: filepath.Join(folder, name)})
}

// ImportGeneratorFolder will import template and entry data from a given folder.
//
// Following files are needed:
// - meta.json
// - print.html.njk
func ImportGeneratorFolder(folder string) (snd.Generator, error) {
	reader := &FolderImportReader{
		base: folder,
	}
	return ImportGenerator(reader)
}
