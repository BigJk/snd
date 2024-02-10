package bind

import (
	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
	"reflect"
	"strings"
)

type Function struct {
	Name string
	Args []string
}

type PostHandler interface {
	POST(path string, h echo.HandlerFunc, m ...echo.MiddlewareFunc) *echo.Route
}

var functions = make(map[string]Function)

func MustBind(handler PostHandler, path string, fn interface{}, m ...echo.MiddlewareFunc) {
	fnType := reflect.TypeOf(fn)

	argNum := fnType.NumIn()
	args := make([]string, argNum)
	for i := 0; i < argNum; i++ {
		args[i] = fnType.In(i).String()
	}

	name := strings.TrimLeft(path, "/")
	functions[name] = Function{
		Name: name,
		Args: args,
	}

	handler.POST(path, echo.WrapHandler(nra.MustBind(fn)), m...)
}

func Functions() map[string]Function {
	return functions
}
