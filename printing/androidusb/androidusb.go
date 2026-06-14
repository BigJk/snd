// Package androidusb adapts Android's USB host APIs to the S&D printer
// interface. Android permission prompts and device access stay in Kotlin/Java;
// this Go package only forwards endpoint discovery and ESC/POS bytes.
package androidusb

import (
	"encoding/json"
	"errors"
	"image"
)

type Bridge interface {
	AvailableEndpointsJSON() (string, error)
	Print(endpoint string, data []byte) error
}

type USB struct {
	bridge Bridge
}

func New(bridge Bridge) *USB {
	return &USB{bridge: bridge}
}

func (u *USB) Name() string {
	return "Android USB Printing"
}

func (u *USB) Description() string {
	return "Print through Android USB host APIs. Android will ask for device permission before the first print."
}

func (u *USB) AvailableEndpoints() (map[string]string, error) {
	if u.bridge == nil {
		return map[string]string{}, nil
	}

	raw, err := u.bridge.AvailableEndpointsJSON()
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

func (u *USB) Print(endpoint string, image image.Image, data []byte) error {
	if u.bridge == nil {
		return errors.New("android usb bridge is not configured")
	}
	return u.bridge.Print(endpoint, data)
}
