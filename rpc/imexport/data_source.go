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

type Argument struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Default     any    `json:"default"`
}

type DataSourceImportFunc func(args []any) ([]snd.DataSource, [][]snd.Entry, error)

type DataSourceImport struct {
	Name        string               `json:"name"`
	RPCName     string               `json:"rpcName"`
	Description string               `json:"description"`
	Arguments   []Argument           `json:"arguments"`
	Func        DataSourceImportFunc `json:"-"`
}

var imports = []DataSourceImport{
	{
		Name:        "Folder",
		RPCName:     "Folder",
		Description: "Import a folder.",
		Arguments: []Argument{
			{
				Name:        "Folder",
				Description: "The path to the folder.",
				Type:        "FolderPath",
			},
		},
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
	{
		Name:        "ZIP",
		RPCName:     "ZIP",
		Description: "Import a ZIP file.",
		Arguments: []Argument{
			{
				Name:        "File",
				Description: "The path to the ZIP file.",
				Type:        "FilePath",
			},
		},
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
	{
		Name:        "JSON",
		RPCName:     "JSON",
		Description: "Import a JSON string.",
		Arguments: []Argument{
			{
				Name:        "JSON",
				Description: "The JSON string.",
				Type:        "Text",
			},
		},
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
	{
		Name:        "CSV",
		RPCName:     "CSV",
		Description: "You can import data from simple CSV files that you exported from Google Sheets or Excel. Visit the Sales & Dungeons Wiki for more information on the layout.",
		Arguments: []Argument{
			{
				Name:        "File",
				Description: "The path to the CSV file.",
				Type:        "FilePath",
			},
		},
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
	{
		Name:        "Fight Club 5e",
		RPCName:     "FightClub5e",
		Description: "You can import data from Fight Club 5e Compediums. This will convert all the included data (Items, Monsters, Races, Background, ...) and add them as Data Sources. As the compediums don't contain the basic information like name, author, etc. Please insert them manually.",
		Arguments: []Argument{
			{
				Name:        "File",
				Description: "The path to the .xml compendium file.",
				Type:        "FilePath",
			},
			{
				Name:        "Name",
				Description: "The name of the source.",
				Type:        "Text",
				Default:     "Source Name Prefix",
			},
			{
				Name:        "Author",
				Description: "The author of the source.",
				Type:        "Text",
				Default:     "Source Author",
			},
			{
				Name:        "Description",
				Description: "The description of the source.",
				Type:        "Text",
				Default:     "Some cool description...",
			},
			{
				Name:        "Slug",
				Description: "The slug of the source.",
				Type:        "Text",
				Default:     "source-slug-prefix",
			},
		},
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
	{
		Name:        "FoundryVTT",
		RPCName:     "FoundryVTT",
		Description: "You can import data from FoundryVTT Modules and Systems. This will convert all the included packs and add them as Data Sources. To import a Module or System open the module.json or system.json file in it's folder.",
		Arguments: []Argument{
			{
				Name:        "File",
				Description: "The path to the system.json or module.json file.",
				Type:        "FilePath",
			},
		},
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
	{
		Name:        "5e.tools Single File",
		RPCName:     "5eToolsSingleFile",
		Description: "Import a single 5e Tools JSON file.",
		Arguments: []Argument{
			{
				Name:        "File",
				Description: "The path to the 5e Tools JSON file.",
				Type:        "FilePath",
			},
		},
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
	{
		Name:        "5e.tools Folder",
		RPCName:     "5eToolsFolder",
		Description: "Import a folder of 5e.tools JSON files.",
		Arguments: []Argument{
			{
				Name:        "Folder",
				Description: "The path to the 5e.tools folder.",
				Type:        "FolderPath",
			},
		},
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

func RegisterDataSourceImports(route *echo.Group, db database.Database) {
	route.POST("/importsSource", echo.WrapHandler(nra.MustBind(func() ([]DataSourceImport, error) {
		return imports, nil
	})))

	for i := range imports {
		importFunc := imports[i].Func
		route.POST("/importsSource"+imports[i].RPCName, echo.WrapHandler(nra.MustBind(func(args []any) error {
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
