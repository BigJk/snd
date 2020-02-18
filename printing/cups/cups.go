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
	return "Print via CUPS attached printer."
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
