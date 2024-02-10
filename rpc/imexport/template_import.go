package imexport

import (
	"encoding/base64"
	"errors"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
	"io/ioutil"
	"net/http"
	"strings"
)

// TemplateImportFunc is a function that imports a template from a given set of arguments.
type TemplateImportFunc func(args []any) ([]snd.Template, [][]snd.Entry, error)

// TemplateImport is a template import.
type TemplateImport struct {
	ImExport
	Func TemplateImportFunc `json:"-"`
}

var templateImports = []TemplateImport{
	//
	// Folder
	//
	{
		ImExport: NewImExport("Folder", "Folder", "Import a folder.",
			Arg("Folder", "The folder to import.", "FolderPath", nil),
		),
		Func: func(args []any) ([]snd.Template, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			tmpl, entries, err := imexport.ImportTemplateFolder(folderPath)
			if err != nil {
				return nil, nil, err
			}

			return []snd.Template{tmpl}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// ZIP
	//
	{
		ImExport: NewImExport("ZIP", "ZIP", "Import a ZIP file.",
			Arg("File", "The path to the ZIP file.", "FilePath", nil),
		),
		Func: func(args []any) ([]snd.Template, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			var tmpl snd.Template
			var entries []snd.Entry
			var err error

			if strings.HasPrefix(filePath, "data:") {
				// read from data uri
				split := strings.Split(filePath, ",")
				if len(split) != 2 {
					return nil, nil, errors.New("not a valid data url")
				}

				data, err := base64.StdEncoding.DecodeString(split[1])
				if err != nil {
					return nil, nil, err
				}

				buf := filebuffer.New(data)
				defer buf.Close()

				tmpl, entries, err = imexport.ImportTemplateZIP(buf, int64(len(data)))
			} else {
				// read from path
				tmpl, entries, err = imexport.ImportTemplateZIPFile(filePath)
			}

			if err != nil {
				return nil, nil, err
			}

			return []snd.Template{tmpl}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// Folder
	//
	{
		ImExport: NewImExport("URL", "URL", "Import a .zip from URL.",
			Arg("URL", "The URL to the zip file.", "Text", nil),
		),
		Func: func(args []any) ([]snd.Template, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			url, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			resp, err := http.Get(url)
			if err != nil {
				return nil, nil, err
			}

			data, err := ioutil.ReadAll(resp.Body)
			buf := filebuffer.New(data)
			defer buf.Close()

			tmpl, entries, err := imexport.ImportTemplateZIP(buf, int64(len(data)))
			if err != nil {
				return nil, nil, err
			}

			return []snd.Template{tmpl}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// JSON
	//
	{
		ImExport: NewImExport("JSON", "JSON", "Import a JSON string.",
			Arg("JSON", "The JSON string.", "Text", nil),
		),
		Func: func(args []any) ([]snd.Template, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			json, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			tmpl, entries, err := imexport.ImportTemplateJSON(json)
			if err != nil {
				return nil, nil, err
			}

			return []snd.Template{tmpl}, [][]snd.Entry{entries}, nil
		},
	},
}

// RegisterTemplateImports registers all template imports.
func RegisterTemplateImports(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/importsTemplate", func() ([]TemplateImport, error) {
		return templateImports, nil
	})

	for i := range templateImports {
		importFunc := templateImports[i].Func
		bind.MustBind(route, "/importsTemplate"+templateImports[i].RPCName, func(args []any) error {
			templates, entries, err := importFunc(args)
			if err != nil {
				return err
			}

			for i := range templates {
				// Delete old entries
				_ = db.DeleteEntries(templates[i].ID())

				// Save new template and entries
				_ = db.SaveTemplate(templates[i])
				_ = db.SaveEntries(templates[i].ID(), entries[i])
			}

			return nil
		})
	}
}
