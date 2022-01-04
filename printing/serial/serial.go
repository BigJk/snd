package serial

import (
	"errors"
	"fmt"
	"image"
	"strings"

	"go.bug.st/serial"
)

type Serial struct{}

func (s *Serial) Name() string {
	return "Serial"
}

func (s *Serial) Description() string {
	return "Printing over Serial-Port (e.g. RS232). Endpoint is defined %PORT_NAME%:9600_N81. This specifies 8 data bits, no parity, 1 stop bit and a baudrate of 9600."
}

func (s *Serial) AvailableEndpoints() (map[string]string, error) {
	ports, err := serial.GetPortsList()
	if err != nil {
		return nil, err
	}

	available := map[string]string{}
	for i := range ports {
		available[ports[i]] = ports[i] + ":9600_N81"
	}

	return available, nil
}

func (s *Serial) Print(printerEndpoint string, image image.Image, data []byte) error {
	split := strings.Split(printerEndpoint, ":")
	if len(split) != 2 {
		return errors.New("wrong endpoint syntax")
	}

	var baudrate int
	var parity string
	var dataBits int
	var stopBits int
	if read, err := fmt.Sscanf(split[1], "%d_%1s%1d%1d", &baudrate, &parity, &dataBits, &stopBits); read != 4 || err != nil {
		return errors.New("wrong endpoint syntax")
	}

	mode := serial.Mode{
		BaudRate: baudrate,
		DataBits: dataBits,
		Parity:   serial.NoParity,
		StopBits: serial.OneStopBit,
	}

	switch stopBits {
	case 1:
		mode.StopBits = serial.OneStopBit
	case 2:
		mode.StopBits = serial.TwoStopBits
	case 3:
		mode.StopBits = serial.OnePointFiveStopBits
	default:
		return errors.New("unsupported stop bit value")
	}

	switch parity {
	case "N":
		mode.Parity = serial.NoParity
	case "M":
		mode.Parity = serial.MarkParity
	case "O":
		mode.Parity = serial.OddParity
	case "S":
		mode.Parity = serial.SpaceParity
	case "E":
		mode.Parity = serial.EvenParity
	default:
		return errors.New("unsupported parity value")
	}

	p, err := serial.Open(split[0], &mode)
	if err != nil {
		return err
	}
	defer p.Close()

	n, err := p.Write(data)
	if err != nil {
		return err
	}

	if n != len(data) {
		return errors.New("not all data was written")
	}

	return nil
}
