package main

import (
	"flag"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/database/badger"
	"github.com/BigJk/snd/database/storm"
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

func openDatabase() database.Database {
	db, err := badger.New("./userdata/")
	if err != nil {
		panic(err)
	}

	// Migrate old db to new one
	if _, err := os.Stat("./data.db"); err == nil {
		oldDb, err := storm.New("./data.db")
		if err == nil {
			fmt.Println("Old database detected. Migrating...")

			templates, _ := oldDb.GetTemplates()
			for i := range templates {
				fmt.Println("Copying", templates[i].ID())

				_ = db.SaveTemplate(templates[i].Template)

				entries, _ := oldDb.GetEntries(templates[i].ID())
				for j := range entries {
					_ = db.SaveEntry(templates[i].ID(), entries[j])
				}
			}

			sources, _ := oldDb.GetSources()
			for i := range sources {
				fmt.Println("Copying", sources[i].ID())

				_ = db.SaveSource(sources[i].DataSource)

				entries, _ := oldDb.GetEntries(sources[i].ID())
				for j := range entries {
					_ = db.SaveEntry(sources[i].ID(), entries[j])
				}
			}

			generators, _ := oldDb.GetGenerators()
			for i := range generators {
				fmt.Println("Copying", generators[i].ID())

				_ = db.SaveGenerator(generators[i])
			}

			if err := oldDb.Close(); err != nil {
				fmt.Println("Could not close old database:", err)
			}

			if err := os.Rename("./data.db", "/data_old.db"); err != nil {
				fmt.Println("Could not rename old database:", err)
			}

			_ = db.Sync()

			fmt.Println("Migration done!")
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
