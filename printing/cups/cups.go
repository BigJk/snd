// Package cups provides printing for Sales & Dungeons via cups.
// The printer commands will be written to a temporary file and
// then send as raw data to a printer by name.
package cups

import (
	"io/ioutil"
	"os"
	"os/exec"
)

type CUPS struct{}

func (c *CUPS) Name() string {
	return "CUPS Printing"
}

func (c *CUPS) Description() string {
	return "Print via CUPS attached printer. Use the Name of the printer (not the URI) as Endpoint."
}

func (c *CUPS) Print(printerEndpoint string, data []byte) error {
	file, err := ioutil.TempFile("", "print_*.bin")
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

	return exec.Command("lp", "-d", printerEndpoint, "-o", "raw", file.Name()).Run()
}
