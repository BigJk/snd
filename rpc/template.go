package rpc

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/mattetti/filebuffer"

	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
)

func RegisterTemplate(route *echo.Group, extern *echo.Group, db database.Database) {
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

		file, err := imexport.ExportTemplateZIPFile(tmpl, entries, path)
		if err != nil {
			return "", err
		}

		return file, nil
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

	route.POST("/exportTemplateJSON", echo.WrapHandler(nra.MustBind(func(id string) (string, error) {
		tmpl, err := db.GetTemplate(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		json, err := imexport.ExportTemplateJSON(tmpl, entries)
		if err != nil {
			return "", err
		}
		return string(json), nil
	})))

	route.POST("/importTemplateZip", echo.WrapHandler(nra.MustBind(func(file string) (string, error) {
		var tmpl snd.Template
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

			tmpl, entries, err = imexport.ImportTemplateZIP(buf, int64(len(data)))
		} else {
			// read from path
			tmpl, entries, err = imexport.ImportTemplateZIPFile(file)
		}

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

	route.POST("/importTemplateJSON", echo.WrapHandler(nra.MustBind(func(json string) (string, error) {
		tmpl, entries, err := imexport.ImportTemplateJSON(json)
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

	// ZIP export route so export is possible in headless mode
	route.GET("/export/template/zip/:id", func(c echo.Context) error {
		tmpl, err := db.GetTemplate(c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		entries, err := db.GetEntries(c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		buf := &bytes.Buffer{}
		file, err := imexport.ExportTemplateZIP(tmpl, entries, buf)
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file))
		return c.Blob(http.StatusOK, "application/zip", buf.Bytes())
	})

	//
	//	External API Routes
	//

	extern.GET("/templates", func(c echo.Context) error {
		templates, err := db.GetTemplates()
		if err != nil {
			return c.JSON(http.StatusBadRequest, err.Error())
		}

		type ExternTemplateEntry struct {
			ID          string `json:"id"`
			Name        string `json:"name"`
			Author      string `json:"author"`
			Slug        string `json:"slug"`
			Description string `json:"description"`
		}

		var result []ExternTemplateEntry
		for i := range templates {
			result = append(result, ExternTemplateEntry{
				ID:          templates[i].ID(),
				Name:        templates[i].Name,
				Author:      templates[i].Author,
				Slug:        templates[i].Slug,
				Description: templates[i].Description,
			})
		}

		return c.JSON(http.StatusOK, result)
	})
}
