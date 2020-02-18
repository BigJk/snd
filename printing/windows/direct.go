package windows

import (
	"fmt"
	"math/rand"

	"github.com/alexbrainman/printer"
)

type Direct struct{}

func (dp *Direct) Name() string {
	return "Windows Direct Printing"
}

func (dp *Direct) Description() string {
	return "Directly print to a attached printer."
}

func (dp *Direct) Print(printerEndpoint string, data []byte) error {
	p, err := printer.Open(printerEndpoint)
	if err != nil {
		return err
	}
	defer p.Close()

	if err = p.StartRawDocument(fmt.Sprint(rand.Int())); err != nil {
		return err
	}

	if _, err := p.Write(data); err != nil {
		return err
	}

	if err = p.EndDocument(); err != nil {
		return err
	}

	return nil
}
