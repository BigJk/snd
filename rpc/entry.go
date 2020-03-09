package rpc

import (
	"fmt"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/asdine/storm"
	"github.com/asdine/storm/q"
	"github.com/labstack/echo"
)

func RegisterEntry(route *echo.Group, db *storm.DB) {
	route.POST("/getEntries", echo.WrapHandler(nra.MustBind(func(id int, page int, search string) ([]snd.Entry, error) {
		var entries []snd.Entry

		if len(search) == 0 {
			if err := db.From(fmt.Sprint(id)).Select().Skip(page * 50).Limit(50).Find(&entries); err != nil && err != storm.ErrNotFound {
				return nil, err
			}
		} else {
			if err := db.From(fmt.Sprint(id)).Select(q.Re("Data", "(?i)"+search)).Skip(page * 50).Limit(50).Find(&entries); err != nil && err != storm.ErrNotFound {
				return nil, err
			}
		}

		return entries, nil
	})))

	route.POST("/getEntriesPages", echo.WrapHandler(nra.MustBind(func(id int, search string) (int, error) {
		var c int
		var err error

		if len(search) == 0 {
			if c, err = db.From(fmt.Sprint(id)).Select().Count(&snd.Entry{}); err != nil && err != storm.ErrNotFound {
				return 0, err
			}
		} else {
			if c, err = db.From(fmt.Sprint(id)).Select(q.Re("Data", "(?i)"+search)).Count(&snd.Entry{}); err != nil && err != storm.ErrNotFound {
				return 0, err
			}
		}

		return (c / 50) + 1, nil
	})))

	route.POST("/saveEntry", echo.WrapHandler(nra.MustBind(func(id int, e snd.Entry) error {
		return db.From(fmt.Sprint(id)).Save(&e)
	})))

	route.POST("/deleteEntry", echo.WrapHandler(nra.MustBind(func(id int, eid int) error {
		return db.From(fmt.Sprint(id)).DeleteStruct(&snd.Entry{ID: eid})
	})))

	route.POST("/getEntry", echo.WrapHandler(nra.MustBind(func(id int, eid int) (*snd.Entry, error) {
		var entry snd.Entry
		if err := db.From(fmt.Sprint(id)).One("ID", eid, &entry); err != nil {
			return nil, err
		}

		return &entry, nil
	})))
}
