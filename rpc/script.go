package rpc

import (
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/labstack/echo"
)

func RegisterScript(route *echo.Group, db database.Database) {
	route.POST("/saveScript", echo.WrapHandler(nra.MustBind(db.SaveScript)))
	route.POST("/deleteScript", echo.WrapHandler(nra.MustBind(db.DeleteScript)))
	route.POST("/getScripts", echo.WrapHandler(nra.MustBind(db.GetScripts)))
	route.POST("/getScript", echo.WrapHandler(nra.MustBind(db.GetScript)))

	/*route.POST("/runScript", echo.WrapHandler(nra.MustBind(func(id int) error {
		script, err := db.GetScript(id)
		if err != nil {
			return err
		}

		return scriptEngine.Exec(&script)
	})))

	route.POST("/verifyScript", echo.WrapHandler(nra.MustBind(func(script string) ([]snd.ScriptError, error) {
		return scriptEngine.Verify(script), nil
	})))*/
}
