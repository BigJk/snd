package rpc

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"
	"sync"

	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
	"github.com/vincent-petithory/dataurl"
)

// RegisterImageUtilities registers all image utilities.
func RegisterImageUtilities(route *echo.Group, db database.Database) {
	// fetchImage fetches a image from a url and returns it as a dataurl.
	bind.MustBind(route, "/fetchImage", func(url string) (string, error) {
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
	})

	//
	// Image cache to avoid using long data uris in the templates
	//

	cacheMutex := sync.RWMutex{}
	cache := map[string]string{}

	decodeDataURI := func(dataURI string) ([]byte, string, error) {
		data, err := dataurl.DecodeString(dataURI)
		if err != nil {
			return nil, "", err
		}
		contentType := http.DetectContentType(data.Data)
		return data.Data, contentType, nil
	}

	// Fill cache with templates
	templates, err := db.GetTemplates()
	if err == nil {
		for _, template := range templates {
			for _, img := range template.Images {
				hash := sha256.Sum256([]byte(img))
				hashHex := fmt.Sprintf("%x", hash)

				cacheMutex.Lock()
				cache[hashHex] = img
				cacheMutex.Unlock()
			}
		}
	}

	route.POST("/image-cache", func(c echo.Context) error {
		body, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		dataUri := strings.Trim(string(body), "\"")
		hash := sha256.Sum256([]byte(dataUri))
		hashHex := fmt.Sprintf("%x", hash)

		cacheMutex.Lock()
		cache[hashHex] = dataUri
		cacheMutex.Unlock()

		return c.NoContent(http.StatusOK)
	})

	route.GET("/image-cache/:id", func(c echo.Context) error {
		hash := c.Param("id")

		cacheMutex.RLock()
		val, ok := cache[hash]
		cacheMutex.RUnlock()

		if ok {
			data, contentType, err := decodeDataURI(val)
			if err != nil {
				return c.JSON(http.StatusBadRequest, err)
			}
			return c.Blob(http.StatusOK, contentType, data)
		}

		templates, err := db.GetTemplates()
		if err != nil {
			return c.JSON(http.StatusBadRequest, err)
		}

		for _, template := range templates {
			for _, img := range template.Images {
				hash := sha256.Sum256([]byte(img))
				hashHex := fmt.Sprintf("%x", hash)

				cacheMutex.Lock()
				cache[hashHex] = img
				cacheMutex.Unlock()

				if hashHex == c.Param("id") {
					data, contentType, err := decodeDataURI(img)
					if err != nil {
						return c.JSON(http.StatusBadRequest, err)
					}
					return c.Blob(http.StatusOK, contentType, data)
				}
			}
		}

		return c.JSON(http.StatusBadRequest, errors.New("image not found"))
	})
}
