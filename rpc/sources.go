package rpc

import (
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/rpc/bind"
	rpcImexport "github.com/BigJk/snd/rpc/imexport"
	"github.com/labstack/echo/v4"
)

func RegisterSources(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/saveSource", db.SaveSource)
	bind.MustBind(route, "/deleteSource", db.DeleteSource)
	bind.MustBind(route, "/getSources", db.GetSources)
	bind.MustBind(route, "/getSource", db.GetSource)

	bind.MustBind(route, "/exportSourceJSON", func(id string) (string, error) {
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
	})

	rpcImexport.RegisterDataSourceExports(route, db)
	rpcImexport.RegisterDataSourceImports(route, db)
}
