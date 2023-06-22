package rpc

import (
	"errors"
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/database/cloud"
	"github.com/labstack/echo/v4"
)

func RegisterCloud(route *echo.Group, db database.Database) {
	route.POST("/syncLocalToCloud", echo.WrapHandler(nra.MustBind(func() error {
		cloudDb, ok := db.(*cloud.Cloud)
		if !ok {
			return errors.New("cloud sync is not active")
		}

		return cloudDb.CopyFromLocal()
	})))

	route.POST("/syncCloudToLocal", echo.WrapHandler(nra.MustBind(func() error {
		cloudDb, ok := db.(*cloud.Cloud)
		if !ok {
			return errors.New("cloud sync is not active")
		}

		return cloudDb.CopyFromLocal()
	})))
}
