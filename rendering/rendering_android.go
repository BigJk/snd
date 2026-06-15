//go:build android

// Package rendering provides a function to render HTML to images or HTML after JS execution.
package rendering

import (
	"bytes"
	"errors"
	"image"
	_ "image/png"
	"net/url"
	"sync"
)

type AndroidRenderer interface {
	RenderURL(url string, width int32) ([]byte, error)
	ExtractHTML(url string, selector string) (string, error)
}

var (
	androidRendererMu sync.RWMutex
	androidRenderer   AndroidRenderer
)

func SetAndroidRenderer(renderer AndroidRenderer) {
	androidRendererMu.Lock()
	defer androidRendererMu.Unlock()
	androidRenderer = renderer
}

func InitBrowser() {}

func Shutdown() error {
	return nil
}

func RenderHTML(html string, width int) (image.Image, error) {
	return RenderURL("data:text/html,"+url.PathEscape(html), width)
}

func RenderURL(targetURL string, width int) (image.Image, error) {
	androidRendererMu.RLock()
	renderer := androidRenderer
	androidRendererMu.RUnlock()

	if renderer == nil {
		return nil, errors.New("android renderer is not configured")
	}

	pngData, err := renderer.RenderURL(targetURL, int32(width))
	if err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewReader(pngData))
	if err != nil {
		return nil, err
	}

	return img, nil
}

func ExtractHTML(targetURL string, selector string) (string, error) {
	androidRendererMu.RLock()
	renderer := androidRenderer
	androidRendererMu.RUnlock()

	if renderer == nil {
		return "", errors.New("android renderer is not configured")
	}

	return renderer.ExtractHTML(targetURL, selector)
}
