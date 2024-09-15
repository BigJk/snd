// Package cups provides printing for Sales & Dungeons via cups.
// The printer commands will be written to a temporary file and
// then send as raw data to a printer by name.
package cups

import (
	"image"
	"io/ioutil"
	"os"
	"os/exec"
	"regexp"
)

type CUPS struct{}

func (c *CUPS) Name() string {
	return "CUPS Printing"
}

func (c *CUPS) Description() string {
	return "Print via CUPS attached printer. Use the Name of the printer (not the URI) as endpoint. Check the S&D documentation for more information on how to set up CUPS."
}

var devicesRegex = regexp.MustCompile(`(?mU)device for (.+):`)

func (c *CUPS) AvailableEndpoints() (map[string]string, error) {
	output, err := exec.Command("lpstat", "-s").CombinedOutput()
	if err != nil {
		return nil, err
	}

	found := devicesRegex.FindAllStringSubmatch(string(output), -1)
	available := map[string]string{}
	for i := range found {
		available[found[i][1]] = found[i][1]
	}

	return available, nil
}

func (c *CUPS) Print(printerEndpoint string, image image.Image, data []byte) error {
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
