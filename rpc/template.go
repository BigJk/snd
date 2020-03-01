package rpc

import (
	"fmt"
	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/asdine/storm"
	"github.com/labstack/echo"
)

func RegisterTemplate(route *echo.Group, db *storm.DB) {
	route.POST("/saveTemplate", echo.WrapHandler(nra.MustBind(func(t snd.Template) error {
		return db.Save(&t)
	})))

	route.POST("/deleteTemplate", echo.WrapHandler(nra.MustBind(func(id int) error {
		return db.DeleteStruct(&snd.Template{ID: id})
	})))

	route.POST("/getTemplates", echo.WrapHandler(nra.MustBind(func() (interface{}, error) {
		var templates []snd.Template
		if err := db.All(&templates); err != nil && err != storm.ErrNotFound {
			return nil, err
		}

		type TemplateEntry struct {
			snd.Template
			Count int `json:"count"`
		}

		var templateListings []TemplateEntry
		for i := range templates {
			c, _ := db.From(fmt.Sprint(templates[i].ID)).Count(&snd.Entry{})

			templateListings = append(templateListings, TemplateEntry{
				Template: templates[i],
				Count:    c,
			})
		}

		return templateListings, nil
	})))

	route.POST("/getTemplate", echo.WrapHandler(nra.MustBind(func(id int) (*snd.Template, error) {
		var template snd.Template
		if err := db.One("ID", id, &template); err != nil {
			return nil, err
		}

		return &template, nil
	})))
}
