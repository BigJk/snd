package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/asdine/storm"
	"github.com/labstack/echo"
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
}
