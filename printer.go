package snd

type Printer interface {
	Print(printerEndpoint, html string) error
}

// WithPrinter overwrites the default printer behaviour
// of the server.
func WithPrinter(printer Printer) ServerOption {
	return func(s *Server) error {
		s.printerOverwrite = printer
		return nil
	}
}
