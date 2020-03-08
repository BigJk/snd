package printing

type Printer interface {
	Name() string
	Description() string
	AvailableEndpoints() (map[string]string, error)
	Print(printerEndpoint string, data []byte) error
}

// PossiblePrinters
type PossiblePrinter map[string]Printer
