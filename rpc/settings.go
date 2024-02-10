package rpc

import (
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

func RegisterSettings(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/getSettings", db.GetSettings)
	bind.MustBind(route, "/saveSettings", db.SaveSettings)
}
