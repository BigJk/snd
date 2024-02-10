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

// GeneratorImportFunc is a function that imports a generator from a given set of arguments.
type GeneratorImportFunc func(args []any) ([]snd.Generator, error)

// GeneratorImport is a generator import.
type GeneratorImport struct {
	ImExport
	Func GeneratorImportFunc `json:"-"`
}

var generatorImports = []GeneratorImport{
	//
	// Folder
	//
	{
		ImExport: NewImExport("Folder", "Folder", "Import a folder.",
			Arg("Folder", "The folder to import.", "FolderPath", nil),
		),
		Func: func(args []any) ([]snd.Generator, error) {
			if len(args) != 1 {
				return nil, errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return nil, errors.New("invalid argument type")
			}

			gen, err := imexport.ImportGeneratorFolder(folderPath)
			if err != nil {
				return nil, err
			}

			return []snd.Generator{gen}, nil
		},
	},
	//
	// ZIP
	//
	{
		ImExport: NewImExport("ZIP", "ZIP", "Import a ZIP file.",
			Arg("File", "The path to the ZIP file.", "FilePath", nil),
		),
		Func: func(args []any) ([]snd.Generator, error) {
			if len(args) != 1 {
				return nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, errors.New("invalid argument type")
			}

			var gen snd.Generator
			var err error

			if strings.HasPrefix(filePath, "data:") {
				// read from data uri
				split := strings.Split(filePath, ",")
				if len(split) != 2 {
					return nil, errors.New("not a valid data url")
				}

				data, err := base64.StdEncoding.DecodeString(split[1])
				if err != nil {
					return nil, err
				}

				buf := filebuffer.New(data)
				defer buf.Close()

				gen, err = imexport.ImportGeneratorZIP(buf, int64(len(data)))
			} else {
				// read from path
				gen, err = imexport.ImportGeneratorZIPFile(filePath)
			}

			if err != nil {
				return nil, err
			}

			return []snd.Generator{gen}, nil
		},
	},
	//
	// Folder
	//
	{
		ImExport: NewImExport("URL", "URL", "Import a .zip from URL.",
			Arg("URL", "The URL to the zip file.", "Text", nil),
		),
		Func: func(args []any) ([]snd.Generator, error) {
			if len(args) != 1 {
				return nil, errors.New("invalid number of arguments")
			}

			url, ok := args[0].(string)
			if !ok {
				return nil, errors.New("invalid argument type")
			}

			resp, err := http.Get(url)
			if err != nil {
				return nil, err
			}

			data, err := ioutil.ReadAll(resp.Body)
			buf := filebuffer.New(data)
			defer buf.Close()

			gen, err := imexport.ImportGeneratorZIP(buf, int64(len(data)))
			if err != nil {
				return nil, err
			}

			return []snd.Generator{gen}, nil
		},
	},
	//
	// JSON
	//
	{
		ImExport: NewImExport("JSON", "JSON", "Import a JSON string.",
			Arg("JSON", "The JSON string.", "Text", nil),
		),
		Func: func(args []any) ([]snd.Generator, error) {
			if len(args) != 1 {
				return nil, errors.New("invalid number of arguments")
			}

			json, ok := args[0].(string)
			if !ok {
				return nil, errors.New("invalid argument type")
			}

			gen, err := imexport.ImportGeneratorJSON(json)
			if err != nil {
				return nil, err
			}

			return []snd.Generator{gen}, nil
		},
	},
}

// RegisterGeneratorImports registers all generator imports.
func RegisterGeneratorImports(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/importsGenerator", func() ([]GeneratorImport, error) {
		return generatorImports, nil
	})

	for i := range generatorImports {
		importFunc := generatorImports[i].Func
		bind.MustBind(route, "/importsGenerator"+generatorImports[i].RPCName, func(args []any) error {
			generators, err := importFunc(args)
			if err != nil {
				return err
			}

			for i := range generators {
				// Delete old entries
				_ = db.DeleteEntries(generators[i].ID())

				// Save new generator and entries
				_ = db.SaveGenerator(generators[i])
			}

			return nil
		})
	}
}
