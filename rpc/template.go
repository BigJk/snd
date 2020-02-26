package rpc

import (
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

	route.POST("/getTemplates", echo.WrapHandler(nra.MustBind(func() ([]snd.Template, error) {
		var templates []snd.Template
		if err := db.All(&templates); err != nil && err != storm.ErrNotFound {
			return nil, err
		}

		return templates, nil
	})))

	route.POST("/getTemplate", echo.WrapHandler(nra.MustBind(func(id int) (*snd.Template, error) {
		var template snd.Template
		if err := db.One("ID", id, &template); err != nil {
			return nil, err
		}

		return &template, nil
	})))
}
