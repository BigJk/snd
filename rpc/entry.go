package rpc

import (
	"strings"

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
		var dataSources []string
		var entriesSources []EntrySource

		if strings.HasPrefix(id, "tmpl:") {
			tmpl, err := db.GetTemplate(id)
			if err != nil {
				return nil, err
			}
			dataSources = tmpl.DataSources

			// load all base entries
			entries, err := db.GetEntries(id)
			if err != nil {
				return nil, err
			}

			entriesSources = lo.Map(entries, func(e snd.Entry, i int) EntrySource {
				return EntrySource{
					Entry:  e,
					Source: id,
				}
			})
		} else if strings.HasPrefix(id, "gen:") {
			gen, err := db.GetGenerator(id)
			if err != nil {
				return nil, err
			}
			dataSources = gen.DataSources
		}

		// fetch all associated data sources
		for i := range dataSources {
			dsEntries, err := db.GetEntries(dataSources[i])
			if err != nil {
				// ignore errors from data sources for now.
				// TODO: revisit in the future
				continue
			}

			entriesSources = append(entriesSources, lo.Map(dsEntries, func(e snd.Entry, _ int) EntrySource {
				return EntrySource{
					Entry:  e,
					Source: dataSources[i],
				}
			})...)
		}

		return entriesSources, nil
	})))

	route.POST("/copyEntries", echo.WrapHandler(nra.MustBind(func(from string, to string) error {
		entries, err := db.GetEntries(from)
		if err != nil {
			return err
		}

		for i := range entries {
			if err := db.SaveEntry(to, entries[i]); err != nil {
				return err
			}
		}

		return nil
	})))
}
