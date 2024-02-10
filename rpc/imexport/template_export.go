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

// TemplateExportFunction is a function that exports a template from a given set of arguments.
type TemplateExportFunction func(template snd.Template, entries []snd.Entry, args []any) (string, error)

// TemplateExport is a template export.
type TemplateExport struct {
	ImExport
	Func TemplateExportFunction `json:"-"`
}

var templateExports = []TemplateExport{
	//
	// Folder
	//
	{
		ImExport: NewImExport("Folder", "Folder", "Export a folder.",
			Arg("Folder", "The folder to create the folder in.", "FolderPath", nil),
		),
		Func: func(template snd.Template, entries []snd.Entry, args []any) (string, error) {
			if len(args) != 1 {
				return "", errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return "", errors.New("invalid argument type")
			}

			name, err := imexport.ExportTemplateFolder(template, entries, folderPath)
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
		Func: func(template snd.Template, entries []snd.Entry, args []any) (string, error) {
			if len(args) != 1 {
				return "", errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return "", errors.New("invalid argument type")
			}

			name, err := imexport.ExportTemplateZIPFile(template, entries, folderPath)
			if err != nil {
				return "", err
			}

			return fmt.Sprintf("Successfully saved to '%s'", name), nil
		},
	},
}

// RegisterTemplateExports registers all template exports.
func RegisterTemplateExports(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/exportsTemplate", func() ([]TemplateExport, error) {
		return templateExports, nil
	})

	for i := range templateExports {
		exportFunc := templateExports[i].Func
		bind.MustBind(route, "/exportsTemplate"+templateExports[i].RPCName, func(id string, args []any) (string, error) {
			template, err := db.GetTemplate(id)
			if err != nil {
				return "", err
			}

			entries, err := db.GetEntries(id)
			if err != nil {
				return "", err
			}

			return exportFunc(template, entries, args)
		})
	}
}
