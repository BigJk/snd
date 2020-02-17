package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"image"
	_ "image/png"
	"io/ioutil"
	"math/rand"
	"os"
	"os/exec"
	"time"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/thermalprinter/epson"
	"github.com/chromedp/chromedp"
)

type CUPSPrinter struct{}

func (s *CUPSPrinter) Print(printerEndpoint, html string) error {
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	var imageData []byte
	if err := chromedp.Run(ctx, chromedp.Tasks{
		chromedp.EmulateViewport(380, 10000),
		chromedp.Navigate("data:text/html," + html),
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

	fileName := "./temp/" + fmt.Sprint(rand.Int()) + ".bin"
	if err := ioutil.WriteFile(fileName, buf.Bytes(), 0666); err != nil {
		return err
	}

	return exec.Command("lp", "-d", printerEndpoint, "-o", "raw", fileName).Run()
}

func main() {
	useCups := flag.Bool("with-cups", false, "")
	flag.Parse()

	_ = os.Mkdir("./temp", 0666)

	rand.Seed(time.Now().UnixNano())

	var serverOptions []snd.ServerOption
	if *useCups {
		serverOptions = append(serverOptions, snd.WithPrinter(&CUPSPrinter{}))
	}

	s, err := snd.NewServer("./data.db", serverOptions...)
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	_ = s.Start(":7123")
}
