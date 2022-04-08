//go:build ELECTRON
// +build ELECTRON

package main

import (
	"fmt"
	"github.com/BigJk/snd/printing/preview"
	"github.com/BigJk/snd/server"
	"io"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/asticode/go-astikit"
	"github.com/asticode/go-astilectron"
)

var prev preview.Preview

// This will change the starting routine
// so that a additional Electron window
// will open with the frontend in it.
func init() {
	startFunc = startElectron
	serverOptions = append(serverOptions, server.WithPrinter(&prev))
}

func startElectron(debug bool) {
	// Start the S&D Backend in separate go-routine.
	go func() {
		startServer(debug)
	}()

	var targetWriter io.Writer
	if !debug {
		targetWriter = ioutil.Discard
	} else {
		targetWriter = os.Stdout
	}

	_ = os.Mkdir("./data", 0666)

	time.Sleep(time.Millisecond * 500)
	fmt.Println("If no window is opening please wait a few seconds for the dependencies to download...")

	var a, err = astilectron.New(log.New(targetWriter, "", 0), astilectron.Options{
		AppName:            "SND",
		BaseDirectoryPath:  "./data",
		DataDirectoryPath:  "./data",
		AppIconDefaultPath: "icon.png",
		VersionAstilectron: "0.49.0",
		VersionElectron:    "11.1.0",
		SingleInstance:     true,
		ElectronSwitches: []string{
			"--disable-http-cache",
		},
	})
	if err != nil {
		panic(err)
	}
	prev.Asti = a

	defer a.Close()
	if err := a.Start(); err != nil {
		panic(err)
	}

	var w, _ = a.NewWindow("http://127.0.0.1:7123", &astilectron.WindowOptions{
		Center: astikit.BoolPtr(true),
		Height: astikit.IntPtr(720),
		Width:  astikit.IntPtr(1280),
		WebPreferences: &astilectron.WebPreferences{
			EnableRemoteModule: astikit.BoolPtr(true),
		},
	})
	if err := w.Create(); err != nil {
		panic(err)
	}

	if debug {
		w.OpenDevTools()
	}

	a.Wait()
	time.Sleep(time.Second * 1)
}
