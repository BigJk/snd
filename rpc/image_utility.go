package rpc

import (
	"errors"
	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
	"github.com/vincent-petithory/dataurl"
	"io/ioutil"
	"net/http"
	"strings"
)

// RegisterImageUtilities registers all image utilities.
func RegisterImageUtilities(route *echo.Group) {
	// fetchImage fetches a image from a url and returns it as a dataurl.
	route.POST("/fetchImage", echo.WrapHandler(nra.MustBind(func(url string) (string, error) {
		resp, err := http.Get(url)
		if err != nil {
			return "", err
		}

		if !strings.HasPrefix(resp.Header.Get("Content-Type"), "image/") {
			return "", errors.New("not a image")
		}

		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}

		return dataurl.EncodeBytes(data), nil
	})))
}
