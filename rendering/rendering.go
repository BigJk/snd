// Package rendering provides a function to render HTML to images. It uses the
// Chrome Debug Protocol through the rod package. It will download a headless
// Chrome version if needed that matches the current platform.
//
// If the environment variable SND_DEBUG=1 it will start the chrome instances
// in non-headless mode.
package rendering

import (
	"bytes"
	"errors"
	"image"
	_ "image/png"
	"net/url"
	"os"

	"github.com/go-rod/rod/lib/launcher"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
)

var browser *rod.Browser

func init() {
	if os.Getenv("SND_DEBUG") == "1" {
		l := launcher.New().
			Headless(false).
			Devtools(true)

		browser = rod.New().ControlURL(l.MustLaunch()).MustConnect()
	} else {
		browser = rod.New().MustConnect()
	}
}

func screenshotPage(page *rod.Page, width int) (image.Image, error) {
	imageData, err := page.MustSetViewport(width, 10000, 1.0, false).MustElement("body").Screenshot(proto.PageCaptureScreenshotFormatPng, 100)
	if err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewBuffer(imageData))
	if err != nil {
		return nil, err
	}

	if img.Bounds().Max.Y >= 9500 {
		return nil, errors.New("too large")
	}

	return img, nil
}

// RenderHTML renders the element #content into an image.
func RenderHTML(html string, width int) (image.Image, error) {
	page := browser.MustPage("data:text/html," + url.PathEscape(html))
	page.MustWaitLoad().MustWaitIdle()
	defer page.Close()

	return screenshotPage(page, width)
}

// RenderURL opens the URL and renders the element #content into an image.
func RenderURL(url string, width int) (image.Image, error) {
	page := browser.MustPage(url)
	page.MustWaitLoad().MustWaitIdle()
	defer page.Close()

	return screenshotPage(page, width)
}
