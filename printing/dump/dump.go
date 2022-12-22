package dump

import (
	"errors"
	"image"
	"io/ioutil"
)

type Dump struct{}

func (r *Dump) Name() string {
	return "Dump Raw"
}

func (r *Dump) Description() string {
	return "Dumps the raw commands content to file. Endpoint should be the path to the file that will be written."
}

func (r *Dump) AvailableEndpoints() (map[string]string, error) {
	return map[string]string{}, nil
}

func (r *Dump) Print(printerEndpoint string, image image.Image, data []byte) error {
	if len(printerEndpoint) == 0 {
		return errors.New("please specify a file path as endpoint")
	}

	return ioutil.WriteFile(printerEndpoint, data, 0666)
}
