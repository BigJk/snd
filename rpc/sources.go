package rpc

import (
	"io/ioutil"
	"net/http"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/inexport"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
)

func RegisterSources(route *echo.Group, db database.Database) {
	route.POST("/saveSource", echo.WrapHandler(nra.MustBind(db.SaveSource)))
	route.POST("/deleteSource", echo.WrapHandler(nra.MustBind(db.DeleteSource)))
	route.POST("/getSources", echo.WrapHandler(nra.MustBind(db.GetSources)))
	route.POST("/getSource", echo.WrapHandler(nra.MustBind(db.GetSource)))

	route.POST("/importSourceFolder", echo.WrapHandler(nra.MustBind(func(folder string) (string, error) {
		ds, entries, err := inexport.ImportSourceFolder(folder)
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
		ds, entries, err := inexport.ImportSourceZIPFile(file)
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

		ds, entries, err := inexport.ImportSourceZIP(buf, int64(len(data)))
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
