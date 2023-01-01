// Package rsnd provides printing for Sales & Dungeons via a another S&D instance.
// The printer commands will be sent as http post request to the given endpoint.
package rsnd

import (
	"bytes"
	"errors"
	"fmt"
	"image"
	"io/ioutil"
	"net/http"
)

type RemoteSND struct{}

func (r *RemoteSND) Name() string {
	return "Remote Sales & Dungeons"
}

func (r *RemoteSND) Description() string {
	return "Print via another Sales & Dungeons instance in your network. Endpoint should be the ip."
}

func (r *RemoteSND) AvailableEndpoints() (map[string]string, error) {
	return map[string]string{}, nil
}

func (r *RemoteSND) Print(printerEndpoint string, image image.Image, data []byte) error {
	resp, err := http.Post(fmt.Sprintf("http://%s:7123/api/extern/print_raw", printerEndpoint), "application/octet-stream", bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return errors.New(string(body))
	}

	return nil
}
