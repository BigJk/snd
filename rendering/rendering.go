// Package rendering provides a function to render HTML to images. It uses the
// Chrome Debug Protocol through the rod package. It will download a headless
// Chrome version if needed that matches the current platform.
//
// If the environment variable SND_DEBUG=1 it will start the chrome instances
// in non-headless mode.
package rendering

import (
	"bytes"
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

// RenderHTML renders the element #content into a image.
func RenderHTML(html string, width int) (image.Image, error) {
	page := browser.MustPage("data:text/html," + url.PathEscape(html))
	page.MustWaitLoad().MustWaitIdle()

	imageData, err := page.MustSetViewport(width, 100000, 1.0, false).MustElement("body").Screenshot(proto.PageCaptureScreenshotFormatPng, 100)
	if err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewBuffer(imageData))
	if err != nil {
		return nil, err
	}

	return img, nil
}
