// +build windows

package main

import (
	"github.com/BigJk/snd/printing/windows"
	"github.com/BigJk/snd/server"
)

// This will add the windows direct printing to the
// available printing types. This will only be build
// and executed on Windows systems.
func init() {
	serverOptions = append(serverOptions, server.WithPrinter(&windows.Direct{}))
}
