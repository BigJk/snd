package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4"
)

func RegisterGenerator(route *echo.Group, extern *echo.Group, db database.Database) {
	route.POST("/saveGenerator", echo.WrapHandler(nra.MustBind(db.SaveGenerator)))
	route.POST("/deleteGenerator", echo.WrapHandler(nra.MustBind(db.DeleteGenerator)))
	route.POST("/getGenerators", echo.WrapHandler(nra.MustBind(db.GetGenerators)))
	route.POST("/getGenerator", echo.WrapHandler(nra.MustBind(db.GetGenerator)))
}
