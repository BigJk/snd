package main

import (
	"flag"
	"fmt"
	"github.com/BigJk/snd/database/cloud"
	"math/rand"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/database/badger"
	"github.com/BigJk/snd/printing/cups"
	"github.com/BigJk/snd/printing/dump"
	"github.com/BigJk/snd/printing/remote"
	"github.com/BigJk/snd/printing/rsnd"
	"github.com/BigJk/snd/printing/serial"
	"github.com/BigJk/snd/rendering"
	"github.com/BigJk/snd/server"
)

var serverOptions []server.Option
var startFunc = startServer

func syncBaseUrl() string {
	override := os.Getenv("SND_SYNC_BASE_URL")
	if override != "" {
		fmt.Println("INFO: overriding sync base url with", override)
		return override
	}
	// TODO: Set default sync base url
	return ""
}

func openDatabase() database.Database {
	db, err := badger.New("./userdata/")
	if err != nil {
		panic(err)
	}

	if settings, err := db.GetSettings(); err == nil {
		if settings.EnableSync {
			if err := cloud.CheckKey(syncBaseUrl(), settings.SyncKey); err != nil {
				fmt.Println("ERROR: could not validate sync key!", err, "=> disabling sync")
				settings.EnableSync = false
				_ = db.SaveSettings(settings)
			} else {
				fmt.Println("INFO: enabling sync")
				return cloud.New(syncBaseUrl(), settings.SyncKey, db)
			}
		}
	}

	return db
}

func startServer(db database.Database, debug bool) {
	rand.Seed(time.Now().UnixNano())

	s, err := server.New(db, append(serverOptions, server.WithDebug(debug), server.WithPrinter(&cups.CUPS{}), server.WithPrinter(&remote.Remote{}), server.WithPrinter(&serial.Serial{}), server.WithPrinter(&rsnd.RemoteSND{}), server.WithPrinter(&dump.Dump{}))...)
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	_ = s.Start(":7123")
}

// fixWorkingDir will change the working directory to the directory of the executable if snd files are not present.
// This fixes a problem on macOS where if you double-click the executable it will start with working directory set
// to the home of the user.
func fixWorkingDir() bool {
	if runtime.GOOS == "windows" {
		return false
	}

	pwd, err := os.Getwd()
	if err == nil {
		ensure := []string{"/frontend", "/data"}
		correctDir := true

		// Check if all relevant folders are present
		for i := range ensure {
			if stat, err := os.Stat(filepath.Join(pwd, ensure[i])); err != nil || !stat.IsDir() {
				correctDir = false
				break
			}
		}

		// If they are present we don't change working dir
		if correctDir {
			return false
		}

		// Change working dir to executable dir in hopes to resolve the problem
		execDir, err := os.Executable()
		if err == nil && pwd != execDir {
			if err := os.Chdir(filepath.Dir(execDir)); err != nil {
				fmt.Println("ERROR: could not set working dir to", execDir, err)
				return false
			}
			return true
		} else {
			fmt.Println("ERROR: could not get exec dir", err)
		}
	} else {
		fmt.Println("ERROR: could not get working dir", err)
	}

	return false
}

func main() {
	debug := flag.Bool("debug", false, "")
	flag.Parse()

	fmt.Println(`
   _____        _____  
  / ____| ___  |  __ \ 
 | (___  ( _ ) | |  | |
  \___ \ / _ \/\ |  | |
  ____) | (_>  < |__| |
 |_____/ \___/\/_____/ 
________________________________________`)
	if len(snd.GitCommitHash) > 0 {
		fmt.Println("Build Time    :", snd.BuildTime)
		fmt.Println("Commit Branch :", snd.GitBranch)
		fmt.Println("Commit Hash   :", snd.GitCommitHash)
	}

	if fixWorkingDir() {
		fmt.Println("\nWARNING        : The working directory didn't seem to contain the app data. Switching to executable directory!")
	}

	wd, _ := os.Getwd()
	exec, _ := os.Executable()

	fmt.Println("Working Dir   :", wd)
	fmt.Println("Exec Dir      :", exec)

	rendering.InitBrowser()

	startFunc(openDatabase(), *debug)
}
