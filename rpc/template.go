package rpc

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"path/filepath"

	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/mattetti/filebuffer"

	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
)

func RegisterTemplate(route *echo.Group, db database.Database) {
	route.POST("/saveTemplate", echo.WrapHandler(nra.MustBind(db.SaveTemplate)))
	route.POST("/deleteTemplate", echo.WrapHandler(nra.MustBind(db.DeleteTemplate)))
	route.POST("/getTemplates", echo.WrapHandler(nra.MustBind(db.GetTemplates)))
	route.POST("/getTemplate", echo.WrapHandler(nra.MustBind(db.GetTemplate)))

	route.POST("/exportTemplateZip", echo.WrapHandler(nra.MustBind(func(id string, path string) (string, error) {
		tmpl, err := db.GetTemplate(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		buf := &bytes.Buffer{}
		file, err := imexport.ExportTemplateZIP(tmpl, entries, buf)
		if err != nil {
			return "", err
		}
		return filepath.Join(path, file), ioutil.WriteFile(filepath.Join(path, file), buf.Bytes(), 0666)
	})))

	route.POST("/exportTemplateFolder", echo.WrapHandler(nra.MustBind(func(id string, path string) (string, error) {
		tmpl, err := db.GetTemplate(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		folderName, err := imexport.ExportTemplateFolder(tmpl, entries, path)
		if err != nil {
			return "", err
		}
		return filepath.Join(path, folderName), nil
	})))

	route.POST("/importTemplateZip", echo.WrapHandler(nra.MustBind(func(file string) (string, error) {
		tmpl, entries, err := imexport.ImportTemplateZIPFile(file)
		if err != nil {
			return "", err
		}

		if err := db.SaveTemplate(tmpl); err != nil {
			return "", err
		}
		_ = db.DeleteEntries(tmpl.ID())
		for i := range entries {
			_ = db.SaveEntry(tmpl.ID(), entries[i])
		}

		return tmpl.Name, nil
	})))

	route.POST("/importTemplateFolder", echo.WrapHandler(nra.MustBind(func(folder string) (string, error) {
		tmpl, entries, err := imexport.ImportTemplateFolder(folder)
		if err != nil {
			return "", err
		}

		if err := db.SaveTemplate(tmpl); err != nil {
			return "", err
		}
		_ = db.DeleteEntries(tmpl.ID())
		for i := range entries {
			_ = db.SaveEntry(tmpl.ID(), entries[i])
		}

		return tmpl.Name, nil
	})))

	route.POST("/importTemplateUrl", echo.WrapHandler(nra.MustBind(func(url string) (string, error) {
		resp, err := http.Get(url)
		if err != nil {
			return "", err
		}

		data, err := ioutil.ReadAll(resp.Body)
		buf := filebuffer.New(data)
		defer buf.Close()

		tmpl, entries, err := imexport.ImportTemplateZIP(buf, int64(len(data)))
		if err != nil {
			return "", err
		}

		if err := db.SaveTemplate(tmpl); err != nil {
			return "", err
		}
		_ = db.DeleteEntries(tmpl.ID())
		for i := range entries {
			_ = db.SaveEntry(tmpl.ID(), entries[i])
		}

		return tmpl.Name, nil
	})))
}
