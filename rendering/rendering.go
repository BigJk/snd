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
	"fmt"
	"image"
	_ "image/png"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/BigJk/snd/log"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/launcher/flags"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
)

var browser *rod.Browser

var macChromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
var windowsChromePaths = []string{"Program Files (x86)/Google/Chrome/Application/chrome.exe", "Program Files/Google/Chrome/Application/chrome.exe"}

// detectChrome tries to search for a local chrome instance to use to avoid downloading a chrome browser.
func detectChrome() (string, error) {
	chrome, err := exec.LookPath("chrome")
	if err == nil {
		return chrome, nil
	}

	chromium, err := exec.LookPath("chromium")
	if err == nil {
		return chromium, nil
	}

	if runtime.GOOS == "darwin" {
		if file, err := os.Stat(macChromePath); err == nil && !file.IsDir() {
			return macChromePath, nil
		}
	} else if runtime.GOOS == "windows" {
		for _, drive := range strings.Split("CABDEFGHIJKLMNOPQRSTUVWXYZ", "") {
			for _, path := range windowsChromePaths {
				executable := fmt.Sprintf("%s:/%s", drive, path)
				if file, err := os.Stat(executable); err == nil && !file.IsDir() {
					return executable, nil
				}
			}
		}
	}

	return "", errors.New("local chrome not found")
}

func InitBrowser() {
	if browser != nil {
		_ = browser.Close()
	}

	// if you want rod to connect to a custom chrome instance instead of downloading and
	// auto connecting you can set the SND_CHROME_ADDR to the address of target instance.
	// Input might look like: 2814, 127.0.0.1:2814, ws://127.0.0.1:2814, ...
	//
	// you can use the rod docker container:
	// - https://github.com/go-rod/rod/pkgs/container/rod
	// - https://github.com/go-rod/rod/blob/master/lib/examples/connect-browser/main.go#L21
	customChromeUrl := os.Getenv("SND_CHROME_ADDR")
	if len(customChromeUrl) > 0 {
		u := launcher.MustResolveURL(customChromeUrl)
		browser = rod.New().ControlURL(u).MustConnect()
		return
	}

	l := launcher.New()

	// specify a local chrome binary instead of downloading.
	customChromeBinary := os.Getenv("SND_CHROME_BIN")
	if len(customChromeBinary) > 0 {
		l.Set(flags.Bin, customChromeBinary)
	} else if os.Getenv("SND_CHROME_SKIP_LOCAL") != "1" {
		// try to auto-detect chrome
		if chrome, err := detectChrome(); err == nil {
			l.Set(flags.Bin, chrome)
			log.Info("local chrome found! If rendering causes problems start S&D with the environment flag SND_CHROME_SKIP_LOCAL=1", log.WithValue("bin", chrome))
		} else {
			log.Info("local chrome not found")
		}
	}

	// disable leakless for now on windows (https://github.com/BigJk/snd/issues/28)
	if runtime.GOOS == "windows" {
		log.Info("disabling leakless on windows")
		l = l.Leakless(false)
	}

	// if SND_CHROME_DEBUG=1 we start the chrome instance in non-headless and with opened
	// devtools so that we can see and debug the rendering that happens.
	if os.Getenv("SND_CHROME_DEBUG") == "1" {
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
		InitBrowser()
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
