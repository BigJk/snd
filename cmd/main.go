package main

import (
	"github.com/BigJk/snd"
)

func main() {
	s, err := snd.NewServer("./data.db")
	if err != nil {
		panic(err)
	}

	if err != nil {
		panic(err)
	}

	_ = s.Start(":7123")
}
