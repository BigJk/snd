package rendering

import (
	"bytes"
	"context"
	"image"
	"net/url"
	"os"

	"github.com/chromedp/chromedp"

	_ "image/png"
)

var commonChromePaths = []string{
	"./data/vendor/chrome-win/chrome.exe",
	"./data/vendor/chrome-linux/chrome",
	"./data/vendor/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
}

// RenderHTML renders the element #content into a image.
func RenderHTML(html string, width int) (image.Image, error) {
	var ctx context.Context
	var cancel context.CancelFunc

	// Check for common chrome executable locations and use
	// these instead of letting chromedp search for it.
	for i := range commonChromePaths {
		if _, err := os.Stat(commonChromePaths[i]); !os.IsNotExist(err) {
			aCtx, aCancel := chromedp.NewExecAllocator(context.Background(), append(chromedp.DefaultExecAllocatorOptions[:],
				chromedp.ExecPath(commonChromePaths[i]),
			)...)
			defer aCancel()

			ctx, cancel = chromedp.NewContext(aCtx)
			defer cancel()
		}
	}

	// If no chrome was found let chromedp find it and
	// hope that chrome is installed.
	if ctx == nil {
		ctx, cancel = chromedp.NewContext(context.Background())
		defer cancel()
	}

	var imageData []byte
	if err := chromedp.Run(ctx, chromedp.Tasks{
		chromedp.EmulateViewport(int64(width), 10000),
		chromedp.Navigate("data:text/html," + url.PathEscape(html)),
		chromedp.WaitVisible("#content", chromedp.ByID),
		chromedp.Screenshot("body", &imageData, chromedp.NodeVisible, chromedp.ByQuery),
	}); err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewBuffer(imageData))
	if err != nil {
		return nil, err
	}

	return img, nil
}
