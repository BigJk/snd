// +build ELECTRON

package main

import (
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/asticode/go-astikit"
	"github.com/asticode/go-astilectron"
)

// This will change the starting routine
// so that a additional Electron window
// will open with the frontend in it.
func init() {
	startFunc = startElectron
}

func startElectron() {
	debug := flag.Bool("debug", false, "")
	flag.Parse()

	// Start the S&D Backend in separate go-routine.
	go func() {
		startServer()
	}()

	var targetWriter io.Writer
	if !*debug {
		targetWriter = ioutil.Discard
	} else {
		targetWriter = os.Stdout
	}

	_ = os.Mkdir("./data", 0666)

	time.Sleep(time.Millisecond * 500)
	fmt.Println("If no window is opening please wait a few seconds for the dependencies to download...")

	var a, _ = astilectron.New(log.New(targetWriter, "", 0), astilectron.Options{
		AppName:            "Sales & Dungeons",
		BaseDirectoryPath:  "./data",
		DataDirectoryPath:  "./data",
		AppIconDefaultPath: "icon.png",
		VersionElectron:    "8.0.1",
		ElectronSwitches: []string{
			"--disable-http-cache",
		},
	})
	defer a.Close()
	a.Start()

	var w, _ = a.NewWindow("http://127.0.0.1:7123", &astilectron.WindowOptions{
		Center: astikit.BoolPtr(true),
		Height: astikit.IntPtr(720),
		Width:  astikit.IntPtr(1280),
	})
	w.Create()

	if *debug {
		w.OpenDevTools()
	}

	a.Wait()
	time.Sleep(time.Second * 1)
}
