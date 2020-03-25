package rpc

import (
	"bytes"
	"time"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
	"github.com/asdine/storm"
	"github.com/labstack/echo"

	"go.etcd.io/bbolt"
)

func RegisterBasic(route *echo.Group, db *storm.DB) {
	route.POST("/getVersion", echo.WrapHandler(nra.MustBind(func() (interface{}, error) {
		return struct {
			BuildTime     string `json:"buildTime"`
			GitCommitHash string `json:"gitCommitHash"`
			GitBranch     string `json:"gitBranch"`
		}{
			BuildTime:     snd.BuildTime,
			GitCommitHash: snd.GitCommitHash,
			GitBranch:     snd.GitBranch,
		}, nil
	})))

	route.POST("/getSettings", echo.WrapHandler(nra.MustBind(func() (*snd.Settings, error) {
		var settings snd.Settings
		if err := db.Get("base", "settings", &settings); err != nil {
			return nil, err
		}

		return &settings, nil
	})))

	route.POST("/saveSettings", echo.WrapHandler(nra.MustBind(func(s snd.Settings) error {
		return db.Set("base", "settings", &s)
	})))

	route.POST("/getLogs", echo.WrapHandler(nra.MustBind(func(hours int) ([]log.Entry, error) {
		var logs []log.Entry

		_ = db.Bolt.View(func(tx *bbolt.Tx) error {
			c := tx.Bucket([]byte("logs")).Cursor()

			// From -hours to now
			min := []byte(time.Now().Add(time.Hour * -1 * time.Duration(hours)).Format(time.RFC3339))
			max := []byte(time.Now().Add(time.Hour).Format(time.RFC3339))

			for k, v := c.Seek(min); k != nil && bytes.Compare(k, max) <= 0; k, v = c.Next() {
				var e log.Entry
				if err := db.Codec().Unmarshal(v, &e); err != nil {
					_ = log.ErrorString("error while unmarshal of log entry", log.WithValue("err", err))
				} else {
					logs = append(logs, e)
				}
			}

			return nil
		})

		return logs, nil
	})))
}
