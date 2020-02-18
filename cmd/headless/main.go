package main

import (
	"math/rand"
	"time"

	"github.com/BigJk/snd/printing/cups"
	"github.com/BigJk/snd/printing/remote"

	"github.com/BigJk/snd"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	s, err := snd.NewServer("./data.db", snd.WithPrinter(&cups.CUPS{}), snd.WithPrinter(&remote.Remote{}))
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	_ = s.Start(":7123")
}
