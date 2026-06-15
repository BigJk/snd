package imexport

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

// DataSourceExportFunc is a function that exports a data source from a given set of arguments.
type DataSourceExportFunc func(source snd.DataSource, entries []snd.Entry, args []any) (string, error)

// DataSourceExport is a data source export.
type DataSourceExport struct {
	ImExport
	Func DataSourceExportFunc `json:"-"`
}

var sourceExports = []DataSourceExport{
	//
	// Folder
	//
	{
		ImExport: NewImExport("Folder", "Folder", "Export a folder.",
			Arg("Folder", "The folder to create the folder in.", "FolderPath", nil),
		),
		Func: func(source snd.DataSource, entries []snd.Entry, args []any) (string, error) {
			if len(args) != 1 {
				return "", errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return "", errors.New("invalid argument type")
			}

			name, err := imexport.ExportSourceFolder(source, entries, folderPath)
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
		Func: func(source snd.DataSource, entries []snd.Entry, args []any) (string, error) {
			if len(args) != 1 {
				return "", errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return "", errors.New("invalid argument type")
			}

			name, err := imexport.ExportSourceZIPFile(source, entries, folderPath)
			if err != nil {
				return "", err
			}

			return fmt.Sprintf("Successfully saved to '%s'", name), nil
		},
	},
}

// RegisterDataSourceExports registers all data source exports.
func RegisterDataSourceExports(route *echo.Group, db database.Database, nativeSaver NativeFileSaver) {
	bind.MustBind(route, "/exportsSource", func() ([]DataSourceExport, error) {
		if nativeSaver != nil {
			return []DataSourceExport{
				{
					ImExport: NewImExport("ZIP", "NativeZIP", "Export a ZIP file."),
				},
			}, nil
		}
		return sourceExports, nil
	})

	bind.MustBind(route, "/exportsSourceNativeZIP", func(id string, args []any) (string, error) {
		if nativeSaver == nil {
			return "", errors.New("native save dialog is not available")
		}

		source, err := db.GetSource(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		buf := &bytes.Buffer{}
		file, err := imexport.ExportSourceZIP(source, entries, buf)
		if err != nil {
			return "", err
		}

		if err := nativeSaver.SaveFile(file, "application/zip", buf.Bytes()); err != nil {
			return "", err
		}

		return fmt.Sprintf("Successfully saved '%s'", file), nil
	})

	for i := range sourceExports {
		exportFunc := sourceExports[i].Func
		bind.MustBind(route, "/exportsSource"+sourceExports[i].RPCName, func(id string, args []any) (string, error) {
			source, err := db.GetSource(id)
			if err != nil {
				return "", err
			}

			entries, err := db.GetEntries(id)
			if err != nil {
				return "", err
			}

			return exportFunc(source, entries, args)

		})
	}
}
