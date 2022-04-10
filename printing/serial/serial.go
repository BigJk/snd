package serial

import (
	"errors"
	"fmt"
	"go.bug.st/serial"
	"image"
	"strings"
	"time"
)

type Serial struct{}

func (s *Serial) Name() string {
	return "Serial"
}

func (s *Serial) Description() string {
	return "Printing over Serial-Port (e.g. RS232). Endpoint is defined %PORT_NAME%:9600_N81_1. This specifies 8 data bits, no parity, 1 stop bit and a baudrate of 9600 and a 1 second delay between data chunks."
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

func chunkData(slice []byte, chunkSize int) [][]byte {
	var chunks [][]byte
	for i := 0; i < len(slice); i += chunkSize {
		end := i + chunkSize

		// necessary check to avoid slicing beyond
		// slice capacity
		if end > len(slice) {
			end = len(slice)
		}

		chunks = append(chunks, slice[i:end])
	}

	return chunks
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
	var waitSecs int
	if read, err := fmt.Sscanf(split[1], "%d_%1s%1d%1d_%1d", &baudrate, &parity, &dataBits, &stopBits, &waitSecs); read != 5 || err != nil {
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

	bytePerSecond := baudrate / 8

	chunks := chunkData(data, bytePerSecond)
	for i := range chunks {
		n, err := p.Write(chunks[i])
		if err != nil {
			return err
		}

		if n != len(chunks[i]) {
			return errors.New("not all data was written")
		}

		if waitSecs > 0 {
			time.Sleep(time.Second * time.Duration(waitSecs))
		}
	}

	return nil
}
