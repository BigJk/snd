//go:build ELECTRON
// +build ELECTRON

package main

import (
	"io"
	"io/ioutil"
	"os"
	"time"

	stdlog "log"

	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing/preview"
	"github.com/BigJk/snd/server"

	"github.com/asticode/go-astikit"
	"github.com/asticode/go-astilectron"
)

// Electron version to fetch
var electronVersion = "21.0.0"

// Astilectron fork (https://github.com/BigJk/astilectron) version to fetch
var astilectronVersion = "0.0.1"

var prev preview.Preview

// This will change the starting routine so that an additional Electron window
// will open with the frontend in it.
func init() {
	startFunc = startElectron
	serverOptions = append(serverOptions, server.WithPrinter(&prev))
}

func startElectron(db database.Database, debug bool) {
	// Start the S&D Backend in separate go-routine.
	go func() {
		startServer(db, debug)
	}()

	var targetWriter io.Writer
	if !debug {
		targetWriter = ioutil.Discard
	} else {
		targetWriter = os.Stdout
	}

	_ = os.Mkdir("./data", 0666)

	time.Sleep(time.Millisecond * 500)
	log.Info("If no window is opening please wait a few seconds for the dependencies to download...")

	var a, err = astilectron.New(stdlog.New(targetWriter, "", 0), astilectron.Options{
		AppName:            "SND",
		BaseDirectoryPath:  "./data",
		DataDirectoryPath:  "./data",
		AppIconDefaultPath: "icon.png",
		AppIconDarwinPath:  "icon.icns",
		VersionAstilectron: astilectronVersion,
		VersionElectron:    electronVersion,
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
		Height: astikit.IntPtr(920),
		Width:  astikit.IntPtr(1600),
		WebPreferences: &astilectron.WebPreferences{
			EnableRemoteModule: astikit.BoolPtr(true),
			WebviewTag:         astikit.BoolPtr(true),
		},
	})
	if err := w.Create(); err != nil {
		panic(err)
	}

	if debug {
		_ = w.OpenDevTools()
	}

	a.Wait()
	db.Close()
	time.Sleep(time.Second * 1)
}
