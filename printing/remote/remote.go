// Package remote provides printing for Sales & Dungeons via a remote endpoint.
// The printer commands will be send as http post request to the given
// endpoint.
package remote

import (
	"bytes"
	"image"
	"net/http"
)

type Remote struct{}

func (r *Remote) Name() string {
	return "Remote Printing"
}

func (r *Remote) Description() string {
	return "Print via a remote server."
}

func (r *Remote) AvailableEndpoints() (map[string]string, error) {
	return map[string]string{}, nil
}

func (r *Remote) Print(printerEndpoint string, image image.Image, data []byte) error {
	resp, err := http.Post(printerEndpoint, "application/octet-stream", bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	return resp.Body.Close()
}
