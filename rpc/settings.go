package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4"
)

func RegisterSettings(route *echo.Group, db database.Database) {
	route.POST("/getSettings", echo.WrapHandler(nra.MustBind(db.GetSettings)))
	route.POST("/saveSettings", echo.WrapHandler(nra.MustBind(db.SaveSettings)))
}
