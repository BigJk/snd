package rpc

import (
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

func RegisterKeyValue(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/getKey", db.GetKey)
	bind.MustBind(route, "/setKey", db.SetKey)
}
