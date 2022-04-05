package rpc

import (
	"github.com/BigJk/snd/database"

	"github.com/BigJk/nra"
	"github.com/labstack/echo"
)

func RegisterEntry(route *echo.Group, db database.Database) {
	route.POST("/getEntries", echo.WrapHandler(nra.MustBind(db.GetEntries)))
	route.POST("/getEntriesPages", echo.WrapHandler(nra.MustBind(db.GetEntriesPages)))
	route.POST("/saveEntry", echo.WrapHandler(nra.MustBind(db.SaveEntry)))
	route.POST("/deleteEntry", echo.WrapHandler(nra.MustBind(db.DeleteEntry)))
	route.POST("/getEntry", echo.WrapHandler(nra.MustBind(db.GetEntry)))
}
