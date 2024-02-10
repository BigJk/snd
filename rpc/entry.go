package rpc

import (
	"github.com/BigJk/snd/rpc/bind"
	"strings"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/samber/lo"

	"github.com/labstack/echo/v4"
)

func RegisterEntry(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/getEntries", db.GetEntries)
	bind.MustBind(route, "/saveEntry", db.SaveEntry)
	bind.MustBind(route, "/deleteEntry", db.DeleteEntry)
	bind.MustBind(route, "/deleteEntries", db.DeleteEntries)
	bind.MustBind(route, "/countEntries", db.CountEntries)
	bind.MustBind(route, "/getEntry", db.GetEntry)

	type EntrySource struct {
		snd.Entry
		Source string `json:"source"`
	}

	bind.MustBind(route, "/getEntriesWithSources", func(id string) ([]EntrySource, error) {
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
	})

	bind.MustBind(route, "/copyEntries", func(from string, to string) error {
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
	})
}
