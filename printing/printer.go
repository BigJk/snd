package printing

import "image"

type Printer interface {
	Name() string
	Description() string
	AvailableEndpoints() (map[string]string, error)
	Print(printerEndpoint string, image image.Image, data []byte) error
}

// PossiblePrinters
type PossiblePrinter map[string]Printer
