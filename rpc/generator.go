package rpc

import (
	"bytes"
	"fmt"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/rpc/bind"
	rpcImexport "github.com/BigJk/snd/rpc/imexport"
	"github.com/labstack/echo/v4"
	"github.com/mattetti/filebuffer"
	"io/ioutil"
	"net/http"
)

func RegisterGenerator(route *echo.Group, extern *echo.Group, db database.Database) {
	bind.MustBind(route, "/saveGenerator", db.SaveGenerator)
	bind.MustBind(route, "/deleteGenerator", db.DeleteGenerator)
	bind.MustBind(route, "/getGenerators", db.GetGenerators)
	bind.MustBind(route, "/getGenerator", db.GetGenerator)

	bind.MustBind(route, "/importGeneratorJSON", func(json string) (string, error) {
		gen, err := imexport.ImportGeneratorJSON(json)
		if err != nil {
			return "", err
		}

		if err := db.SaveGenerator(gen); err != nil {
			return "", err
		}

		return gen.Name, nil
	})

	bind.MustBind(route, "/importGeneratorUrl", func(url string) (string, error) {
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
	})

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

	rpcImexport.RegisterGeneratorExports(route, db)
	rpcImexport.RegisterGeneratorImports(route, db)

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
