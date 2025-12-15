package rpc

import (
	"bytes"
	"fmt"

	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/BigJk/snd/thermalprinter/epson"
	"github.com/labstack/echo/v4"
)

// sendCommand sends a raw command to the printer.
func sendCommand(db database.Database, printer printing.PossiblePrinter, commandFunc func(*bytes.Buffer)) error {
	settings, err := db.GetSettings()
	if err != nil {
		return err
	}

	selectedPrinter, ok := printer[settings.PrinterType]
	if !ok {
		return fmt.Errorf("printer not found")
	}

	if selectedPrinter == nil {
		return fmt.Errorf("can't send command to this printer")
	}

	buf := &bytes.Buffer{}
	commandFunc(buf)

	err = selectedPrinter.Print(settings.PrinterEndpoint, nil, buf.Bytes())
	if err != nil {
		return fmt.Errorf("printer wasn't able to execute command: %w", err)
	}

	return nil
}

func RegisterPrintCommand(route *echo.Group, db database.Database, printer printing.PossiblePrinter) {
	bind.MustBind(route, "/cutPaper", func() error {
		return sendCommand(db, printer, func(buf *bytes.Buffer) {
			epson.CutPaper(buf)
		})
	})

	bind.MustBind(route, "/openCashDrawer1", func() error {
		return sendCommand(db, printer, func(buf *bytes.Buffer) {
			epson.OpenCashDrawer1(buf)
		})
	})

	bind.MustBind(route, "/openCashDrawer2", func() error {
		return sendCommand(db, printer, func(buf *bytes.Buffer) {
			epson.OpenCashDrawer2(buf)
		})
	})
}
