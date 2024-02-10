package main

import (
	"flag"
	"fmt"
	"github.com/BigJk/snd/database/memory"
	"github.com/BigJk/snd/server"
	"os"
	"time"
)

var supportedLanguages = map[string]bool{
	"python": true,
}

func main() {
	lang := flag.String("lang", "python", "The language to generate the SDK for.")
	out := flag.String("out", "snd_api.py", "The output file for the SDK.")
	flag.Parse()

	if !supportedLanguages[*lang] {
		panic(fmt.Sprintf("Unsupported language: %s", *lang))
	}

	fmt.Println("Starting S&D server to fetch functions...")
	server, err := server.New(memory.New())
	if err != nil {
		panic(err)
	}

	go func() {
		_ = server.Start("127.0.0.1:7123")
	}()

	time.Sleep(time.Second)
	fmt.Println("Shutting down server...")

	var source string
	switch *lang {
	case "python":
		source = pythonSDK()
	}

	fmt.Println("Writing SDK to file...")
	if err := os.WriteFile(*out, []byte(source), 0666); err != nil {
		panic(err)
	}

	fmt.Println("Wrote: ", *out)
}
