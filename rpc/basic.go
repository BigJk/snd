package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4"
)

func RegisterBasic(route *echo.Group, db database.Database) {
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

	route.POST("/getSettings", echo.WrapHandler(nra.MustBind(db.GetSettings)))
	route.POST("/saveSettings", echo.WrapHandler(nra.MustBind(db.SaveSettings)))
	route.POST("/getLogs", echo.WrapHandler(nra.MustBind(db.GetLogs)))
}
