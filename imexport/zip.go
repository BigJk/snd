package imexport

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/BigJk/snd"
)

// ZipImportReader represents a reader that reads files from a zip.
type ZipImportReader struct {
	reader *zip.Reader
}

func (z *ZipImportReader) ReadFile(s string) ([]byte, error) {
	metaFs, err := z.reader.Open(s)
	if err != nil {
		return nil, err
	}
	defer metaFs.Close()

	data, err := ioutil.ReadAll(metaFs)
	if err != nil {
		return nil, err
	}

	return data, nil
}

// ZipExportWriter represents a writer that writes files to a zip.
type ZipExportWriter struct {
	writer *zip.Writer
}

func (z *ZipExportWriter) WriteFile(file string, data []byte) error {
	zipFile, err := z.writer.Create(file)
	if err != nil {
		return err
	}
	if _, err := zipFile.Write(data); err != nil {
		return err
	}
	return nil
}

// ExportTemplateZIP exports the template and entries as a zip file.
//
// Following files will be created in the zip:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
//
// The function returns the advised name for the zip file with the pattern "{tmpl.Autor}_{tmpl.Slug}.zip".
func ExportTemplateZIP(tmpl snd.Template, entries []snd.Entry, writer io.Writer) (string, error) {
	zipper := zip.NewWriter(writer)
	defer zipper.Close()

	return fmt.Sprintf("%s_%s.zip", tmpl.Author, tmpl.Slug), ExportTemplate(tmpl, entries, &ZipExportWriter{writer: zipper})
}

// ExportTemplateZIPFile exports the template and entries as a zip file.
//
// Following files will be created in the zip:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
//
// The function returns the location where the file was written to as "{folder}/{tmpl.Autor}_{tmpl.Slug}.zip".
func ExportTemplateZIPFile(tmpl snd.Template, entries []snd.Entry, folder string) (string, error) {
	buf := &bytes.Buffer{}
	file, err := ExportTemplateZIP(tmpl, entries, buf)
	if err != nil {
		return "", err
	}

	path := filepath.Join(folder, file)
	return path, ioutil.WriteFile(path, buf.Bytes(), 0666)
}

// ImportTemplateZIP will import template and entry data from a given zip.
//
// Following files are needed in the zip:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
func ImportTemplateZIP(reader io.ReaderAt, size int64) (snd.Template, []snd.Entry, error) {
	zipper, err := zip.NewReader(reader, size)
	if err != nil {
		return snd.Template{}, nil, err
	}

	return ImportTemplate(&ZipImportReader{reader: zipper})
}

// ImportTemplateZIPFile will import template and entry data from a given zip file.
//
// Following files are needed in the zip:
// - meta.json
// - print.html.njk
// - list.html.njk
// - skeleton.json
// - entries.json
func ImportTemplateZIPFile(file string) (snd.Template, []snd.Entry, error) {
	zipFile, err := os.Open(file)
	if err != nil {
		return snd.Template{}, nil, err
	}
	defer zipFile.Close()

	stat, err := zipFile.Stat()
	if err != nil {
		return snd.Template{}, nil, err
	}

	return ImportTemplateZIP(zipFile, stat.Size())
}

// ImportSourceZIP will import data source and entry data from a given zip.
//
// Following files are needed:
// - meta.json
// - entries.json
func ImportSourceZIP(reader io.ReaderAt, size int64) (snd.DataSource, []snd.Entry, error) {
	zipper, err := zip.NewReader(reader, size)
	if err != nil {
		return snd.DataSource{}, nil, err
	}

	return ImportSource(&ZipImportReader{reader: zipper})
}

// ImportSourceZIPFile will import data source and entry data from a given zip file.
//
// Following files are needed:
// - meta.json
// - entries.json
func ImportSourceZIPFile(file string) (snd.DataSource, []snd.Entry, error) {
	zipFile, err := os.Open(file)
	if err != nil {
		return snd.DataSource{}, nil, err
	}
	defer zipFile.Close()

	stat, err := zipFile.Stat()
	if err != nil {
		return snd.DataSource{}, nil, err
	}

	return ImportSourceZIP(zipFile, stat.Size())
}

// ExportSourceZIP exports the data source and entries as a zip file.
//
// Following files will be created in the zip:
// - meta.json
// - entries.json
//
// The function returns the advised name for the zip file with the pattern "ds_{tmpl.Autor}_{tmpl.Slug}.zip".
func ExportSourceZIP(ds snd.DataSource, entries []snd.Entry, writer io.Writer) (string, error) {
	zipper := zip.NewWriter(writer)
	defer zipper.Close()

	return fmt.Sprintf("ds_%s_%s.zip", ds.Author, ds.Slug), ExportSource(ds, entries, &ZipExportWriter{writer: zipper})
}

// ExportSourceZIPFile exports the data source and entries as a zip file.
//
// Following files will be created in the zip:
// - meta.json
// - entries.json
//
// The function returns the advised name for the zip file with the pattern "ds_{tmpl.Autor}_{tmpl.Slug}.zip".
func ExportSourceZIPFile(ds snd.DataSource, entries []snd.Entry, folder string) (string, error) {
	buf := &bytes.Buffer{}
	file, err := ExportSourceZIP(ds, entries, buf)
	if err != nil {
		return "", err
	}

	path := filepath.Join(folder, file)
	return path, ioutil.WriteFile(path, buf.Bytes(), 0666)
}

// ExportGeneratorZIP exports the generator and entries as a zip file.
//
// Following files will be created in the zip:
// - meta.json
// - print.html.njk
//
// The function returns the advised name for the zip file with the pattern "gen_{tmpl.Autor}_{tmpl.Slug}.zip".
func ExportGeneratorZIP(gen snd.Generator, writer io.Writer) (string, error) {
	zipper := zip.NewWriter(writer)
	defer zipper.Close()

	return fmt.Sprintf("gen_%s_%s.zip", gen.Author, gen.Slug), ExportGenerator(gen, &ZipExportWriter{writer: zipper})
}

// ExportGeneratorZIPFile exports the generator and entries as a zip file.
//
// Following files will be created in the zip:
// - meta.json
// - print.html.njk
//
// The function returns the location where the file was written to as "{folder}/gen_{tmpl.Autor}_{tmpl.Slug}.zip".
func ExportGeneratorZIPFile(gen snd.Generator, folder string) (string, error) {
	buf := &bytes.Buffer{}
	file, err := ExportGeneratorZIP(gen, buf)
	if err != nil {
		return "", err
	}

	path := filepath.Join(folder, file)
	return path, ioutil.WriteFile(path, buf.Bytes(), 0666)
}

// ImportGeneratorZIP will import generator and entry data from a given zip.
//
// Following files are needed in the zip:
// - meta.json
// - print.html.njk
func ImportGeneratorZIP(reader io.ReaderAt, size int64) (snd.Generator, error) {
	zipper, err := zip.NewReader(reader, size)
	if err != nil {
		return snd.Generator{}, err
	}

	return ImportGenerator(&ZipImportReader{reader: zipper})
}

// ImportGeneratorZIPFile will import generator from a given zip file.
//
// Following files are needed:
// - meta.json
// - print.html.njk
func ImportGeneratorZIPFile(file string) (snd.Generator, error) {
	zipFile, err := os.Open(file)
	if err != nil {
		return snd.Generator{}, err
	}
	defer zipFile.Close()

	stat, err := zipFile.Stat()
	if err != nil {
		return snd.Generator{}, err
	}

	return ImportGeneratorZIP(zipFile, stat.Size())
}
