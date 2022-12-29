// Package rendering provides a function to render HTML to images or HTML after JS execution.
// It uses the Chrome Debug Protocol through the rod package. It will download a headless
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
	"runtime"
	"time"

	"github.com/BigJk/snd/log"
	"github.com/go-rod/rod/lib/launcher"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
)

var browser *rod.Browser

func init() {
	initBrowser()
}

func initBrowser() {
	if browser != nil {
		_ = browser.Close()
	}

	l := launcher.New()

	// disable leakless for now on windows (https://github.com/BigJk/snd/issues/28)
	if runtime.GOOS == "windows" {
		log.Info("disabling leakless on windows")
		l = l.Leakless(false)
	}

	if os.Getenv("SND_DEBUG") == "1" {
		l = l.Headless(false).Devtools(true)
	}

	browser = rod.New().ControlURL(l.MustLaunch()).MustConnect()
}

func Shutdown() error {
	return browser.Close()
}

func tryOpenPage(url string) (*rod.Page, error) {
	var page *rod.Page
	var err error

	for i := 0; i < 2; i++ {
		page, err = browser.Page(proto.TargetCreateTarget{
			URL: url,
		})

		if err == nil {
			return page, nil
		}

		// if the pc has gone into standby the cdp session closes,
		// so we try to init it again and try once more.
		initBrowser()
	}

	// after retry return last error
	return nil, err
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
	page, err := tryOpenPage("data:text/html," + url.PathEscape(html))
	if err != nil {
		return nil, err
	}

	page.MustWaitLoad().MustWaitIdle()
	defer page.Close()

	return screenshotPage(page, width)
}

// RenderURL opens the URL and renders the element #content into an image.
func RenderURL(url string, width int) (image.Image, error) {
	page, err := tryOpenPage(url)
	if err != nil {
		return nil, err
	}

	page.MustWaitLoad().MustWaitIdle()
	defer page.Close()

	return screenshotPage(page, width)
}

// ExtractHTML opens the URL, lets the page executes and returns the HTML.
func ExtractHTML(url string, selector string) (string, error) {
	page, err := tryOpenPage(url)
	if err != nil {
		return "", err
	}

	page.MustWaitLoad().MustWaitIdle()
	defer page.Close()

	if err := page.Timeout(time.Second*5).WaitElementsMoreThan(selector, 0); err != nil {
		return "", err
	}

	sel, err := page.Element(selector)
	if err != nil {
		return "", err
	}

	return sel.HTML()
}
