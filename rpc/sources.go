package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	rpcImexport "github.com/BigJk/snd/rpc/imexport"
	"github.com/labstack/echo/v4"
)

func RegisterSources(route *echo.Group, db database.Database) {
	route.POST("/saveSource", echo.WrapHandler(nra.MustBind(db.SaveSource)))
	route.POST("/deleteSource", echo.WrapHandler(nra.MustBind(db.DeleteSource)))
	route.POST("/getSources", echo.WrapHandler(nra.MustBind(db.GetSources)))
	route.POST("/getSource", echo.WrapHandler(nra.MustBind(db.GetSource)))

	route.POST("/exportSourceJSON", echo.WrapHandler(nra.MustBind(func(id string) (string, error) {
		ds, err := db.GetSource(id)
		if err != nil {
			return "", err
		}

		entries, err := db.GetEntries(id)
		if err != nil {
			return "", err
		}

		json, err := imexport.ExportSourceJSON(ds, entries)
		if err != nil {
			return "", err
		}
		return string(json), nil
	})))

	rpcImexport.RegisterDataSourceExports(route, db)
	rpcImexport.RegisterDataSourceImports(route, db)
}
