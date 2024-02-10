package rpc

import (
	"errors"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/database/cloud"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

func RegisterCloud(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/syncLocalToCloud", func() error {
		cloudDb, ok := db.(*cloud.Cloud)
		if !ok {
			return errors.New("cloud sync is not active")
		}

		return cloudDb.CopyFromLocal()
	})

	bind.MustBind(route, "/syncCloudToLocal", func() error {
		cloudDb, ok := db.(*cloud.Cloud)
		if !ok {
			return errors.New("cloud sync is not active")
		}

		return cloudDb.CopyFromLocal()
	})
}
