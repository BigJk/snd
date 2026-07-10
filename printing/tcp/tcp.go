// Package tcp provides raw ESC/POS printing over a TCP socket.
package tcp

import (
	"bytes"
	"errors"
	"image"
	"io"
	"net"
	"time"
)

const timeout = 10 * time.Second

type TCP struct{}

func (t *TCP) Name() string {
	return "TCP Printing"
}

func (t *TCP) Description() string {
	return "Print via a raw TCP socket. Endpoint should be ip:port or hostname:port (for example 192.168.1.100:9100). The raw ESC/POS printer commands will be written to the socket, then the socket will be closed."
}

func (t *TCP) AvailableEndpoints() (map[string]string, error) {
	return map[string]string{}, nil
}

func (t *TCP) Print(printerEndpoint string, image image.Image, data []byte) error {
	if printerEndpoint == "" {
		return errors.New("please specify a tcp endpoint as ip:port or hostname:port")
	}

	if _, _, err := net.SplitHostPort(printerEndpoint); err != nil {
		return errors.New("wrong endpoint syntax; expected ip:port or hostname:port")
	}

	conn, err := net.DialTimeout("tcp", printerEndpoint, timeout)
	if err != nil {
		return err
	}

	if err := conn.SetWriteDeadline(time.Now().Add(timeout)); err != nil {
		_ = conn.Close()
		return err
	}

	if _, err := io.Copy(conn, bytes.NewReader(data)); err != nil {
		_ = conn.Close()
		return err
	}

	return conn.Close()
}
