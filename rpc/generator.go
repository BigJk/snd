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

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
)

func RegisterGenerator(route *echo.Group, extern *echo.Group, db database.Database) {
	route.POST("/saveGenerator", echo.WrapHandler(nra.MustBind(db.SaveGenerator)))
	route.POST("/deleteGenerator", echo.WrapHandler(nra.MustBind(db.DeleteGenerator)))
	route.POST("/getGenerators", echo.WrapHandler(nra.MustBind(db.GetGenerators)))
	route.POST("/getGenerator", echo.WrapHandler(nra.MustBind(db.GetGenerator)))

	route.POST("/exportGeneratorZip", echo.WrapHandler(nra.MustBind(func(id string, path string) (string, error) {
		gen, err := db.GetGenerator(id)
		if err != nil {
			return "", err
		}

		file, err := imexport.ExportGeneratorZIPFile(gen, path)
		if err != nil {
			return "", err
		}

		return file, nil
	})))

	route.POST("/exportGeneratorFolder", echo.WrapHandler(nra.MustBind(func(id string, path string) (string, error) {
		gen, err := db.GetGenerator(id)
		if err != nil {
			return "", err
		}

		folderName, err := imexport.ExportGeneratorFolder(gen, path)
		if err != nil {
			return "", err
		}
		return filepath.Join(path, folderName), nil
	})))

	route.POST("/exportGeneratorJSON", echo.WrapHandler(nra.MustBind(func(id string) (string, error) {
		gen, err := db.GetGenerator(id)
		if err != nil {
			return "", err
		}

		json, err := imexport.ExportGeneratorJSON(gen)
		if err != nil {
			return "", err
		}
		return string(json), nil
	})))

	route.POST("/importGeneratorZip", echo.WrapHandler(nra.MustBind(func(file string) (string, error) {
		var gen snd.Generator
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

			gen, err = imexport.ImportGeneratorZIP(buf, int64(len(data)))
		} else {
			// read from path
			gen, err = imexport.ImportGeneratorZIPFile(file)
		}

		if err != nil {
			return "", err
		}

		if err := db.SaveGenerator(gen); err != nil {
			return "", err
		}

		return gen.Name, nil
	})))

	route.POST("/importGeneratorFolder", echo.WrapHandler(nra.MustBind(func(folder string) (string, error) {
		gen, err := imexport.ImportGeneratorFolder(folder)
		if err != nil {
			return "", err
		}

		if err := db.SaveGenerator(gen); err != nil {
			return "", err
		}

		return gen.Name, nil
	})))

	route.POST("/importGeneratorJSON", echo.WrapHandler(nra.MustBind(func(json string) (string, error) {
		gen, err := imexport.ImportGeneratorJSON(json)
		if err != nil {
			return "", err
		}

		if err := db.SaveGenerator(gen); err != nil {
			return "", err
		}

		return gen.Name, nil
	})))

	route.POST("/importGeneratorUrl", echo.WrapHandler(nra.MustBind(func(url string) (string, error) {
		resp, err := http.Get(url)
		if err != nil {
			return "", err
		}

		data, err := ioutil.ReadAll(resp.Body)
		buf := filebuffer.New(data)
		defer buf.Close()

		gen, err := imexport.ImportGeneratorZIP(buf, int64(len(data)))
		if err != nil {
			return "", err
		}

		if err := db.SaveGenerator(gen); err != nil {
			return "", err
		}

		return gen.Name, nil
	})))

	// ZIP export route so export is possible in headless mode
	route.GET("/export/generator/zip/:id", func(c echo.Context) error {
		gen, err := db.GetGenerator(c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		buf := &bytes.Buffer{}
		file, err := imexport.ExportGeneratorZIP(gen, buf)
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", file))
		return c.Blob(http.StatusOK, "application/zip", buf.Bytes())
	})

	//
	//	External API Routes
	//

	extern.GET("/generators", func(c echo.Context) error {
		gens, err := db.GetGenerators()
		if err != nil {
			return c.JSON(http.StatusBadRequest, err.Error())
		}

		type ExternGeneratorEntry struct {
			ID          string                `json:"id"`
			Name        string                `json:"name"`
			Author      string                `json:"author"`
			Slug        string                `json:"slug"`
			Description string                `json:"description"`
			Config      []snd.GeneratorConfig `json:"config"`
		}

		var result []ExternGeneratorEntry
		for i := range gens {
			result = append(result, ExternGeneratorEntry{
				ID:          gens[i].ID(),
				Name:        gens[i].Name,
				Author:      gens[i].Author,
				Slug:        gens[i].Slug,
				Description: gens[i].Description,
				Config:      gens[i].Config,
			})
		}

		return c.JSON(http.StatusOK, result)
	})
}
