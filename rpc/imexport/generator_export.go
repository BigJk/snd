package imexport

import (
	"errors"
	"fmt"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

// GeneratorExportFunction is a function that exports a generator from a given set of arguments.
type GeneratorExportFunction func(generator snd.Generator, args []any) (string, error)

// GeneratorExport is a generator export.
type GeneratorExport struct {
	ImExport
	Func GeneratorExportFunction `json:"-"`
}

var generatorExports = []GeneratorExport{
	//
	// Folder
	//
	{
		ImExport: NewImExport("Folder", "Folder", "Export a folder.",
			Arg("Folder", "The folder to create the folder in.", "FolderPath", nil),
		),
		Func: func(generator snd.Generator, args []any) (string, error) {
			if len(args) != 1 {
				return "", errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return "", errors.New("invalid argument type")
			}

			name, err := imexport.ExportGeneratorFolder(generator, folderPath)
			if err != nil {
				return "", err
			}

			return fmt.Sprintf("Successfully saved to '%s'", name), nil
		},
	},
	//
	// ZIP
	//
	{
		ImExport: NewImExport("ZIP", "ZIP", "Export a ZIP file.",
			Arg("Folder", "The folder to save the zip.", "FolderPath", nil),
		),
		Func: func(generator snd.Generator, args []any) (string, error) {
			if len(args) != 1 {
				return "", errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return "", errors.New("invalid argument type")
			}

			name, err := imexport.ExportGeneratorZIPFile(generator, folderPath)
			if err != nil {
				return "", err
			}

			return fmt.Sprintf("Successfully saved to '%s'", name), nil
		},
	},
}

// RegisterGeneratorExports registers all generator exports.
func RegisterGeneratorExports(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/exportsGenerator", func() ([]GeneratorExport, error) {
		return generatorExports, nil
	})

	for i := range generatorExports {
		exportFunc := generatorExports[i].Func
		bind.MustBind(route, "/exportsGenerator"+generatorExports[i].RPCName, func(id string, args []any) (string, error) {
			template, err := db.GetGenerator(id)
			if err != nil {
				return "", err
			}

			return exportFunc(template, args)
		})
	}
}
