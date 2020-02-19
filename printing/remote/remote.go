// Package remote provides printing for Sales & Dungeons via a remote endpoint.
// The printer commands will be send as http post request to the given
// endpoint.
package remote

import (
	"bytes"
	"net/http"
)

type Remote struct{}

func (r *Remote) Name() string {
	return "Remote Printing"
}

func (r *Remote) Description() string {
	return "Print via a remote server."
}

func (r *Remote) Print(printerEndpoint string, data []byte) error {
	resp, err := http.Post(printerEndpoint, "application/octet-stream", bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	return resp.Body.Close()
}
