package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/asdine/storm"
	"github.com/labstack/echo"
)

func RegisterScript(route *echo.Group, db *storm.DB, scriptEngine *snd.ScriptEngine) {
	route.POST("/saveScript", echo.WrapHandler(nra.MustBind(func(s snd.Script) error {
		return db.Save(&s)
	})))

	route.POST("/deleteScript", echo.WrapHandler(nra.MustBind(func(id int) error {
		return db.DeleteStruct(&snd.Script{ID: id})
	})))

	route.POST("/getScripts", echo.WrapHandler(nra.MustBind(func() ([]snd.Script, error) {
		var scripts []snd.Script
		if err := db.All(&scripts); err != nil && err != storm.ErrNotFound {
			return nil, err
		}

		return scripts, nil
	})))

	route.POST("/runScript", echo.WrapHandler(nra.MustBind(func(id int) error {
		var script snd.Script

		if err := db.One("ID", id, &script); err != nil {
			return err
		}

		return scriptEngine.Exec(&script)
	})))

	route.POST("/verifyScript", echo.WrapHandler(nra.MustBind(func(script string) ([]snd.ScriptError, error) {
		return scriptEngine.Verify(script), nil
	})))
}
