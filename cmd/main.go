package main

import (
	"flag"
	"fmt"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database/storm"
	"math/rand"
	"time"

	"github.com/BigJk/snd/printing/cups"
	"github.com/BigJk/snd/printing/remote"
	"github.com/BigJk/snd/printing/serial"
	"github.com/BigJk/snd/server"
)

var serverOptions []server.Option
var startFunc = startServer

func startServer(debug bool) {
	rand.Seed(time.Now().UnixNano())

	db, err := storm.New("./data.db")
	if err != nil {
		panic(err)
	}

	s, err := server.New(db, append(serverOptions, server.WithDebug(debug), server.WithPrinter(&cups.CUPS{}), server.WithPrinter(&remote.Remote{}), server.WithPrinter(&serial.Serial{}))...)
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	_ = s.Start(":7123")
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

	startFunc(*debug)
}
