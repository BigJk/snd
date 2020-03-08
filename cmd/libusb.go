// +build LIBUSB

package main

import (
	"github.com/BigJk/snd/printing/usb"
	"github.com/BigJk/snd/server"
)

// This will add the USB direct printing to the
// available printing types. This will only be build
// and executed when "-tags LIBUSB" is specified in
// building and requires libusb-1.0 as dependency.
func init() {
	serverOptions = append(serverOptions, server.WithPrinter(&usb.USB{}))
}
