package printing

import "image"

// Printer represents the interface a printer should implement to be use-able in S&D.
type Printer interface {
	Name() string
	Description() string
	AvailableEndpoints() (map[string]string, error)
	Print(printerEndpoint string, image image.Image, data []byte) error
}

// PossiblePrinter represents a map of possible printers.
type PossiblePrinter map[string]Printer
