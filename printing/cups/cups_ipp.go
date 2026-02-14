// Package cups provides printing for Sales & Dungeons via cups.
// The printer commands will be written to a temporary file and
// then send as raw data to a printer by name.
package cups

import (
	"fmt"
	"image"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/phin1x/go-ipp"
)

type CUPSIPP struct{}

func (c *CUPSIPP) Name() string {
	return "CUPS Printing (IPP)"
}

func (c *CUPSIPP) Description() string {
	return "Prints to a printer using IPP address exposed by a CUPS server (e.g. ipp://username:password@localhost:631/printers/PrinterName)"
}

func (c *CUPSIPP) AvailableEndpoints() (map[string]string, error) {
	return map[string]string{}, nil
}

func (c *CUPSIPP) Print(printerEndpoint string, img image.Image, data []byte) error {
	// Parse printerEndpoint (e.g. ipp://username:password@localhost:631/printers/PrinterName)
	u, err := url.Parse(printerEndpoint)
	if err != nil {
		return fmt.Errorf("invalid IPP endpoint: %w", err)
	}

	host := u.Hostname()
	port := 631
	if u.Port() != "" {
		p, err := strconv.Atoi(u.Port())
		if err != nil {
			return fmt.Errorf("invalid port: %w", err)
		}
		port = p
	}

	// Extract username and password from URL
	username := ""
	password := ""
	if u.User != nil {
		username = u.User.Username()
		password, _ = u.User.Password()
	}

	// Extract printer name from path (e.g. /printers/PrinterName -> PrinterName)
	pathParts := strings.Split(strings.Trim(u.Path, "/"), "/")
	if len(pathParts) < 2 {
		return fmt.Errorf("invalid printer path: %s", u.Path)
	}
	printer := pathParts[len(pathParts)-1]
	useTLS := u.Scheme == "ipps"

	client := ipp.NewIPPClient(host, port, username, password, useTLS)

	jobAttrs := map[string]interface{}{
		ipp.AttributeDocumentFormat: "application/vnd.cups-raw",
		ipp.AttributeJobName:        "escpos-raw",
	}

	file, err := os.CreateTemp("", "print_*.bin")
	if err != nil {
		return err
	}

	defer func() {
		_ = os.Remove(file.Name())
	}()
	defer file.Close()

	if _, err := file.Write(data); err != nil {
		return err
	}

	_, err = client.PrintFile(file.Name(), printer, jobAttrs)
	if err != nil {
		return err
	}
	return nil
}
