package rpc

import (
	"encoding/base64"
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/imexport/fightclub5e"
	"github.com/BigJk/snd/imexport/vtt"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
)

func RegisterSources(route *echo.Group, db database.Database) {
	route.POST("/saveSource", echo.WrapHandler(nra.MustBind(db.SaveSource)))
	route.POST("/deleteSource", echo.WrapHandler(nra.MustBind(db.DeleteSource)))
	route.POST("/getSources", echo.WrapHandler(nra.MustBind(db.GetSources)))
	route.POST("/getSource", echo.WrapHandler(nra.MustBind(db.GetSource)))

	route.POST("/exportSourceZip", echo.WrapHandler(nra.MustBind(func(id string, path string) (string, error) {
		ds, err := db.GetSource(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		file, err := imexport.ExportSourceZIPFile(ds, entries, path)
		if err != nil {
			return "", err
		}

		return file, nil
	})))

	route.POST("/exportSourceFolder", echo.WrapHandler(nra.MustBind(func(id string, path string) (string, error) {
		ds, err := db.GetSource(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		folderName, err := imexport.ExportSourceFolder(ds, entries, path)
		if err != nil {
			return "", err
		}
		return filepath.Join(path, folderName), nil
	})))

	route.POST("/exportSourceJSON", echo.WrapHandler(nra.MustBind(func(id string) (string, error) {
		ds, err := db.GetSource(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		json, err := imexport.ExportSourceJSON(ds, entries)
		if err != nil {
			return "", err
		}
		return string(json), nil
	})))

	route.POST("/importSourceFolder", echo.WrapHandler(nra.MustBind(func(folder string) (string, error) {
		ds, entries, err := imexport.ImportSourceFolder(folder)
		if err != nil {
			return "", err
		}

		_ = db.DeleteEntries(ds.ID())
		if err := db.SaveSource(ds); err != nil {
			return "", err
		}

		for i := range entries {
			_ = db.SaveEntry(ds.ID(), entries[i])
		}

		return ds.Name, nil
	})))

	route.POST("/importSourceJSON", echo.WrapHandler(nra.MustBind(func(json string) (string, error) {
		ds, entries, err := imexport.ImportSourceJSON(json)
		if err != nil {
			return "", err
		}

		_ = db.DeleteEntries(ds.ID())
		if err := db.SaveSource(ds); err != nil {
			return "", err
		}

		for i := range entries {
			_ = db.SaveEntry(ds.ID(), entries[i])
		}

		return ds.Name, nil
	})))

	route.POST("/importSourceZip", echo.WrapHandler(nra.MustBind(func(file string) (string, error) {
		var ds snd.DataSource
		var entries []snd.Entry
		var err error

		if strings.HasPrefix(file, "data:") {
			// read from data uri
			split := strings.Split(file, ",")
			if len(split) != 2 {
				return "", errors.New("not a valid data url")
			}

			data, err := base64.StdEncoding.DecodeString(split[1])
			if err != nil {
				return "", err
			}

			buf := filebuffer.New(data)
			defer buf.Close()

			ds, entries, err = imexport.ImportSourceZIP(buf, int64(len(data)))
		} else {
			// read from path
			ds, entries, err = imexport.ImportSourceZIPFile(file)
		}

		if err != nil {
			return "", err
		}

		_ = db.DeleteEntries(ds.ID())
		if err := db.SaveSource(ds); err != nil {
			return "", err
		}

		for i := range entries {
			_ = db.SaveEntry(ds.ID(), entries[i])
		}

		return ds.Name, nil
	})))

	route.POST("/importSourceUrl", echo.WrapHandler(nra.MustBind(func(url string) (string, error) {
		resp, err := http.Get(url)
		if err != nil {
			return "", err
		}

		data, err := ioutil.ReadAll(resp.Body)
		buf := filebuffer.New(data)
		defer buf.Close()

		ds, entries, err := imexport.ImportSourceZIP(buf, int64(len(data)))
		if err != nil {
			return "", err
		}

		_ = db.DeleteEntries(ds.ID())
		if err := db.SaveSource(ds); err != nil {
			return "", err
		}

		for i := range entries {
			_ = db.SaveEntry(ds.ID(), entries[i])
		}

		return ds.Name, nil
	})))

	route.POST("/importVttModule", echo.WrapHandler(nra.MustBind(func(moduleFile string) error {
		sources, entries, err := vtt.ConvertDataSources(moduleFile)
		if err != nil {
			return err
		}

		for i := range sources {
			_ = db.DeleteEntries(sources[i].ID())

			if err := db.SaveSource(sources[i]); err == nil {
				for j := range entries[i] {
					_ = db.SaveEntry(sources[i].ID(), entries[i][j])
				}
			}
		}

		return nil
	})))

	route.POST("/importFC5eCompedium", echo.WrapHandler(nra.MustBind(func(file string, name string, author string, slug string, description string) error {
		sources, entries, err := fightclub5e.ImportCompedium(file, name, author, slug, description)
		if err != nil {
			return err
		}

		for i := range sources {
			_ = db.DeleteEntries(sources[i].ID())

			if err := db.SaveSource(sources[i]); err == nil {
				for j := range entries[i] {
					_ = db.SaveEntry(sources[i].ID(), entries[i][j])
				}
			}
		}

		return nil
	})))

	route.POST("/importSourceCSV", echo.WrapHandler(nra.MustBind(func(csvFile string) (string, error) {
		csv, err := os.OpenFile(csvFile, os.O_RDONLY, 0777)
		if err != nil {
			return "", err
		}

		ds, entries, err := imexport.ImportDataSourceCSV(csv)
		if err != nil {
			return "", err
		}

		_ = db.DeleteEntries(ds.ID())

		err = db.SaveSource(ds)
		if err != nil {
			return "", err
		}

		for i := range entries {
			_ = db.SaveEntry(ds.ID(), entries[i])
		}

		return ds.Name, nil
	})))
}
