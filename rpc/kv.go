package rpc

import (
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

func RegisterKeyValue(route *echo.Group, db database.Database) {
	bind.MustBind(route, "/getKey", db.GetKey)
	bind.MustBind(route, "/setKey", db.SetKey)
	bind.MustBind(route, "/getKeysPrefix", db.GetKeysPrefix)

	bind.MustBind(route, "/clearPreviewCache", func() (int, error) {
		keys, err := db.GetKeysPrefix("PIMG_")
		if err != nil {
			return 0, err
		}

		for _, key := range keys {
			err = db.DeleteKey(key)
			if err != nil {
				return 0, err
			}
		}
		return len(keys), nil
	})

	bind.MustBind(route, "/clearAICache", func() (int, error) {
		keys, err := db.GetKeysPrefix("AI_CACHE_")
		if err != nil {
			return 0, err
		}

		for _, key := range keys {
			err = db.DeleteKey(key)
			if err != nil {
				return 0, err
			}
		}
		return len(keys), nil
	})
}
