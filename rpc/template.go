package rpc

import (
	"github.com/BigJk/snd/database"

	"github.com/BigJk/nra"
	"github.com/labstack/echo"
)

func RegisterTemplate(route *echo.Group, db database.Database) {
	route.POST("/saveTemplate", echo.WrapHandler(nra.MustBind(db.SaveTemplate)))
	route.POST("/deleteTemplate", echo.WrapHandler(nra.MustBind(db.DeleteTemplate)))
	route.POST("/getTemplates", echo.WrapHandler(nra.MustBind(db.GetTemplates)))
	route.POST("/getTemplate", echo.WrapHandler(nra.MustBind(db.GetTemplate)))
}
