package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"image"
	_ "image/png"
	"io"
	"io/ioutil"
	"log"
	"math/rand"
	"net/url"
	"os"
	"time"

	"github.com/chromedp/chromedp"

	"github.com/alexbrainman/printer"

	"github.com/BigJk/snd/thermalprinter/epson"

	"github.com/asticode/go-astikit"

	"github.com/BigJk/snd"
	"github.com/asticode/go-astilectron"
)

type DirectPrinter struct{}

func (s *DirectPrinter) Print(printerEndpoint, html string) error {
	p, err := printer.Open(printerEndpoint)
	if err != nil {
		return err
	}
	defer p.Close()

	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	var imageData []byte
	if err := chromedp.Run(ctx, chromedp.Tasks{
		chromedp.EmulateViewport(380, 10000),
		chromedp.Navigate("data:text/html," + url.PathEscape(html)),
		chromedp.WaitVisible("#content", chromedp.ByID),
		chromedp.Screenshot("body", &imageData, chromedp.NodeVisible, chromedp.ByQuery),
	}); err != nil {
		return err
	}

	img, _, err := image.Decode(bytes.NewBuffer(imageData))
	if err != nil {
		return err
	}

	buf := &bytes.Buffer{}
	epson.Image(buf, img)
	_, _ = buf.WriteString("\n\n\n")

	if err = p.StartRawDocument(fmt.Sprint(rand.Int())); err != nil {
		return err
	}

	p.Write(buf.Bytes())

	if err = p.EndDocument(); err != nil {
		return err
	}

	return nil
}

func main() {
	debug := flag.Bool("debug", false, "")
	flag.Parse()

	rand.Seed(time.Now().UnixNano())

	s, err := snd.NewServer("./data.db", snd.WithPrinter(&DirectPrinter{}))
	if err != nil {
		panic(err)
	}

	go func() {
		_ = s.Start(":7123")
	}()

	var targetWriter io.Writer
	if !*debug {
		targetWriter = ioutil.Discard
	} else {
		targetWriter = os.Stdout
	}

	var a, _ = astilectron.New(log.New(targetWriter, "", 0), astilectron.Options{
		AppName:           "Sales & Dungeons",
		BaseDirectoryPath: "./cache",
	})
	defer a.Close()
	a.Start()

	var w, _ = a.NewWindow("http://127.0.0.1:7123", &astilectron.WindowOptions{
		Center: astikit.BoolPtr(true),
		Height: astikit.IntPtr(720),
		Width:  astikit.IntPtr(1280),
	})
	w.Create()

	a.Wait()
}
