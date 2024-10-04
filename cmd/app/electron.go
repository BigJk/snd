//go:build ELECTRON
// +build ELECTRON

package main

import (
	"fmt"
	"io"
	"io/ioutil"
	stdlog "log"
	"net/http"
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
	"github.com/labstack/echo/v4"

	"github.com/asticode/go-astikit"
	"github.com/asticode/go-astilectron"
)

// Electron version to fetch
var electronVersion = "21.0.0"

// Astilectron fork (https://github.com/BigJk/astilectron) version to fetch
var astilectronVersion = "0.0.1"

var prev preview.Preview

var mainWindow *astilectron.Window

// This will change the starting routine so that an additional Electron window
// will open with the frontend in it.
func init() {
	startFunc = startElectron
	onAlreadyRunning = func() {
		fmt.Println("ERROR: Sales & Dungeons is already running!")

		// Send GET request to the server to focus the Electron window
		if _, err := http.Get("http://127.0.0.1:7123/api/focusElectron"); err != nil {
			fmt.Println("ERROR: could not focus Electron window:", err)
		}
	}
	serverOptions = append(serverOptions, server.WithPrinter(&prev), server.WithAdditionalRoutes(func(api *echo.Group) {
		api.GET("/focusElectron", func(c echo.Context) error {
			if mainWindow != nil {
				go mainWindow.Show()
				go mainWindow.Focus()
			}
			return c.NoContent(http.StatusOK)
		})
	}))
}

func startElectron(db database.Database, debug bool) {
	// Writing the preload.js file that is needed for the electron web-view
	if err := os.WriteFile(filepath.Join(sndDataDir, "/preload.js"), []byte(`
// Helper for Sales & Dungeons to let template/generator preview communicate with the main process
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
  sendData: (type, data) => {
    ipcRenderer.sendToHost("data", type, JSON.stringify(data));
  },
});`), 0666); err != nil {
		panic(fmt.Errorf("could not write preload.js file: %w", err))
	}

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
		opts.BaseDirectoryPath = filepath.Join(sndDataDir, "/electron")
		opts.DataDirectoryPath = filepath.Join(sndDataDir, "/electron")

		err := os.MkdirAll(opts.BaseDirectoryPath, 0777)
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

	mainWindow = w

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
