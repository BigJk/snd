//go:build ELECTRON
// +build ELECTRON

package main

import (
	"io"
	"io/ioutil"
	stdlog "log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing/preview"
	"github.com/BigJk/snd/rendering"
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

	time.Sleep(time.Millisecond * 500)
	log.Info("If no window is opening please wait a few seconds for the dependencies to download...")

	opts := astilectron.Options{
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
	}

	if isMacAppBundle() {
		home, err := os.UserHomeDir()
		if err != nil {
			panic(err)
		}
		opts.BaseDirectoryPath = filepath.Join(home, "/Documents/Sales & Dungeons/electron")
		opts.DataDirectoryPath = filepath.Join(home, "/Documents/Sales & Dungeons/electron")

		err = os.MkdirAll(opts.BaseDirectoryPath, 0777)
		log.Info("Changed electron provision folder because of app bundle", log.WithValue("path", opts.BaseDirectoryPath), log.WithValue("mkdir error", err))

		// copy icon files to the electron folder
		_ = exec.Command("cp", "./icon.png", filepath.Join(opts.BaseDirectoryPath, "icon.png")).Run()
		_ = exec.Command("cp", "./icon.icns", filepath.Join(opts.BaseDirectoryPath, "icon.icns")).Run()

		// check if vendor folder exists
		if _, err := os.Stat(filepath.Join(opts.BaseDirectoryPath, "vendor")); os.IsNotExist(err) {
			_ = exec.Command("osascript", "-e", "display dialog \"Thanks for downloading Sales & Dungeons! During the first launch, we're setting things up and downloading dependencies. This may take a few moments. We appreciate your patience!\" buttons {\"OK\"} with title \"Sales & Dungeons First Start\" with icon caution").Run()
		}
	} else {
		_ = os.Mkdir("./data", 0666)
	}

	a, err := astilectron.New(stdlog.New(targetWriter, "", 0), opts)
	if err != nil {
		panic(err)
	}
	prev.Asti = a

	defer a.Close()
	if err := a.Start(); err != nil {
		panic(err)
	}

	w, _ := a.NewWindow("http://127.0.0.1:7123", &astilectron.WindowOptions{
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

	// Wait for interrupt signal to trigger shutdown of application.
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, os.Interrupt, os.Kill, syscall.SIGTERM, syscall.SIGQUIT)
		recvSignal := <-quit

		// Close electron.
		log.Info("interrupt signal received", log.WithValue("signal", recvSignal))
		a.Close()
	}()

	a.Wait()

	log.Info("Shutting down...")

	if err := db.Close(); err != nil {
		_ = log.ErrorUser(err, "could not shutdown database")
	}
	if err := rendering.Shutdown(); err != nil {
		_ = log.ErrorUser(err, "could not shutdown html to image rendering")
	}

	time.Sleep(time.Second * 1)
}
