// Package androidbt adapts Android Bluetooth Classic SPP printer access to the
// S&D printer interface. Pairing and permissions stay in Kotlin/Java; this Go
// package only forwards endpoint discovery and ESC/POS bytes.
package androidbt

import (
	"encoding/json"
	"errors"
	"image"
)

const PrinterName = "Android Bluetooth Printing"

type Bridge interface {
	AvailableEndpointsJSON() (string, error)
	Print(endpoint string, data []byte) error
}

type Bluetooth struct {
	bridge Bridge
}

func New(bridge Bridge) *Bluetooth {
	return &Bluetooth{bridge: bridge}
}

func (b *Bluetooth) Name() string {
	return PrinterName
}

func (b *Bluetooth) Description() string {
	return "Print through paired Android Bluetooth Classic SPP receipt printers."
}

func (b *Bluetooth) AvailableEndpoints() (map[string]string, error) {
	if b.bridge == nil {
		return map[string]string{}, nil
	}

	raw, err := b.bridge.AvailableEndpointsJSON()
	if err != nil {
		return nil, err
	}
	if raw == "" {
		return map[string]string{}, nil
	}

	available := map[string]string{}
	if err := json.Unmarshal([]byte(raw), &available); err != nil {
		return nil, err
	}

	return available, nil
}

func (b *Bluetooth) Print(endpoint string, image image.Image, data []byte) error {
	if b.bridge == nil {
		return errors.New("android bluetooth bridge is not configured")
	}
	return b.bridge.Print(endpoint, data)
}
