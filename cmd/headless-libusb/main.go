package main

import (
	"github.com/BigJk/snd/printing/usb"
	"github.com/BigJk/snd/server"
	"math/rand"
	"time"

	"github.com/BigJk/snd/printing/cups"
	"github.com/BigJk/snd/printing/remote"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	s, err := server.NewServer("./data.db", server.WithPrinter(&cups.CUPS{}), server.WithPrinter(&remote.Remote{}), server.WithPrinter(&usb.USB{}))
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	_ = s.Start(":7123")
}
