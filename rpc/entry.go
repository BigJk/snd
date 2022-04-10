package rpc

import (
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/samber/lo"

	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
)

func RegisterEntry(route *echo.Group, db database.Database) {
	route.POST("/getEntries", echo.WrapHandler(nra.MustBind(db.GetEntries)))
	route.POST("/saveEntry", echo.WrapHandler(nra.MustBind(db.SaveEntry)))
	route.POST("/deleteEntry", echo.WrapHandler(nra.MustBind(db.DeleteEntry)))
	route.POST("/deleteEntries", echo.WrapHandler(nra.MustBind(db.DeleteEntries)))
	route.POST("/countEntries", echo.WrapHandler(nra.MustBind(db.CountEntries)))
	route.POST("/getEntry", echo.WrapHandler(nra.MustBind(db.GetEntry)))

	type EntrySource struct {
		snd.Entry
		Source string `json:"source"`
	}

	route.POST("/getEntriesWithSources", echo.WrapHandler(nra.MustBind(func(id string) ([]EntrySource, error) {
		tmpl, err := db.GetTemplate(id)
		if err != nil {
			return nil, err
		}

		// load all base entries
		entries, err := db.GetEntries(id)
		if err != nil {
			return nil, err
		}

		var entriesSources []EntrySource

		entriesSources = lo.Map(entries, func(e snd.Entry, i int) EntrySource {
			return EntrySource{
				Entry:  e,
				Source: id,
			}
		})

		// fetch all associated data sources
		for i := range tmpl.DataSources {
			dsEntries, err := db.GetEntries(tmpl.DataSources[i])
			if err != nil {
				// ignore errors from data sources for now.
				// TODO: revisit in the future
				continue
			}

			entriesSources = append(entriesSources, lo.Map(dsEntries, func(e snd.Entry, _ int) EntrySource {
				return EntrySource{
					Entry:  e,
					Source: tmpl.DataSources[i],
				}
			})...)
		}

		return entriesSources, nil
	})))
}
