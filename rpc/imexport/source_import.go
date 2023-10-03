package imexport

import (
	"encoding/base64"
	"errors"
	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/imexport/fightclub5e"
	"github.com/BigJk/snd/imexport/tools5e"
	"github.com/BigJk/snd/imexport/vtt"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
	"os"
	"strings"
)

// DataSourceImportFunc is a function that imports a data source from a given set of arguments.
type DataSourceImportFunc func(args []any) ([]snd.DataSource, [][]snd.Entry, error)

// DataSourceImport is a data source import.
type DataSourceImport struct {
	ImExport
	Func DataSourceImportFunc `json:"-"`
}

var sourceImports = []DataSourceImport{
	//
	// Folder
	//
	{
		ImExport: NewImExport("Folder", "Folder", "Import a folder.",
			Arg("Folder", "The folder to import.", "FolderPath", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			ds, entries, err := imexport.ImportSourceFolder(folderPath)
			if err != nil {
				return nil, nil, err
			}

			return []snd.DataSource{ds}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// ZIP
	//
	{
		ImExport: NewImExport("ZIP", "ZIP", "Import a ZIP file.",
			Arg("File", "The path to the ZIP file.", "FilePath", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			var ds snd.DataSource
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

				ds, entries, err = imexport.ImportSourceZIP(buf, int64(len(data)))
			} else {
				// read from path
				ds, entries, err = imexport.ImportSourceZIPFile(filePath)
			}

			if err != nil {
				return nil, nil, err
			}

			return []snd.DataSource{ds}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// JSON
	//
	{
		ImExport: NewImExport("JSON", "JSON", "Import a JSON string.",
			Arg("JSON", "The JSON string.", "Text", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			json, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			ds, entries, err := imexport.ImportSourceJSON(json)
			if err != nil {
				return nil, nil, err
			}

			return []snd.DataSource{ds}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// CSV
	//
	{
		ImExport: NewImExport("CSV", "CSV", "You can import data from simple CSV files that you exported from Google Sheets or Excel. Visit the Sales & Dungeons Wiki for more information on the layout.",
			Arg("File", "The path to the CSV file.", "FilePath", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			csv, err := os.OpenFile(filePath, os.O_RDONLY, 0777)
			if err != nil {
				return nil, nil, err
			}

			source, entries, err := imexport.ImportDataSourceCSV(csv)
			if err != nil {
				return nil, nil, err
			}

			return []snd.DataSource{source}, [][]snd.Entry{entries}, nil
		},
	},
	//
	// Fight Club 5e
	//
	{
		ImExport: NewImExport("Fight Club 5e", "FightClub5e", "You can import data from Fight Club 5e Compediums. This will convert all the included data (Items, Monsters, Races, Background, ...) and add them as Data Sources. As the compediums don't contain the basic information like name, author, etc. Please insert them manually.",
			Arg("File", "The path to the .xml compendium file.", "FilePath", nil),
			Arg("Name", "The name of the source.", "Text", "Source Name Prefix"),
			Arg("Author", "The author of the source.", "Text", "Source Author"),
			Arg("Description", "The description of the source.", "Text", "Some cool description..."),
			Arg("Slug", "The slug of the source.", "Text", "source-slug-prefix"),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 5 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			name, ok := args[1].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			author, ok := args[2].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			description, ok := args[3].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			slug, ok := args[4].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			return fightclub5e.ImportCompedium(filePath, name, author, slug, description)
		},
	},
	//
	// FoundryVTT
	//
	{
		ImExport: NewImExport("FoundryVTT", "FoundryVTT", "You can import data from FoundryVTT Modules and Systems. This will convert all the included packs and add them as Data Sources. To import a Module or System open the module.json or system.json file in it's folder.",
			Arg("File", "The path to the system.json or module.json file.", "FilePath", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			return vtt.ConvertDataSources(filePath)
		},
	},
	//
	// 5e.tools Single File
	//
	{
		ImExport: NewImExport("5e.tools Single File", "5eToolsSingleFile", "Import a single 5e Tools JSON file.",
			Arg("File", "The path to the 5e Tools JSON file.", "FilePath", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			filePath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			return tools5e.ImportFile(filePath)
		},
	},
	//
	// 5e.tools Folder
	//
	{
		ImExport: NewImExport("5e.tools Folder", "5eToolsFolder", "Import a folder of 5e.tools JSON files.",
			Arg("Folder", "The path to the 5e.tools folder.", "FolderPath", nil),
		),
		Func: func(args []any) ([]snd.DataSource, [][]snd.Entry, error) {
			if len(args) != 1 {
				return nil, nil, errors.New("invalid number of arguments")
			}

			folderPath, ok := args[0].(string)
			if !ok {
				return nil, nil, errors.New("invalid argument type")
			}

			return tools5e.ImportFolder(folderPath)
		},
	},
}

// RegisterDataSourceImports registers all data source imports.
func RegisterDataSourceImports(route *echo.Group, db database.Database) {
	route.POST("/importsSource", echo.WrapHandler(nra.MustBind(func() ([]DataSourceImport, error) {
		return sourceImports, nil
	})))

	for i := range sourceImports {
		importFunc := sourceImports[i].Func
		route.POST("/importsSource"+sourceImports[i].RPCName, echo.WrapHandler(nra.MustBind(func(args []any) error {
			sources, entries, err := importFunc(args)
			if err != nil {
				return err
			}

			for i := range sources {
				// Delete old entries
				_ = db.DeleteEntries(sources[i].ID())

				// Save new source and entries
				_ = db.SaveSource(sources[i])
				_ = db.SaveEntries(sources[i].ID(), entries[i])
			}

			return nil
		})))
	}
}
