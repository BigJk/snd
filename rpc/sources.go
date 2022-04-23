package rpc

import (
	"encoding/base64"
	"errors"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
)

func RegisterSources(route *echo.Group, db database.Database) {
	route.POST("/saveSource", echo.WrapHandler(nra.MustBind(db.SaveSource)))
	route.POST("/deleteSource", echo.WrapHandler(nra.MustBind(db.DeleteSource)))
	route.POST("/getSources", echo.WrapHandler(nra.MustBind(db.GetSources)))
	route.POST("/getSource", echo.WrapHandler(nra.MustBind(db.GetSource)))

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
}
