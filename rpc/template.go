package rpc

import (
	"bytes"
	"fmt"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	rpcImexport "github.com/BigJk/snd/rpc/imexport"
	"net/http"

	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
)

func RegisterTemplate(route *echo.Group, extern *echo.Group, db database.Database) {
	route.POST("/saveTemplate", echo.WrapHandler(nra.MustBind(db.SaveTemplate)))
	route.POST("/deleteTemplate", echo.WrapHandler(nra.MustBind(db.DeleteTemplate)))
	route.POST("/getTemplates", echo.WrapHandler(nra.MustBind(db.GetTemplates)))
	route.POST("/getTemplate", echo.WrapHandler(nra.MustBind(db.GetTemplate)))

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

	rpcImexport.RegisterTemplateExports(route, db)
	rpcImexport.RegisterTemplateImports(route, db)

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
