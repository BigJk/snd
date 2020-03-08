// Package windows provides printing for Sales & Dungeons
// via direct printing on windows. The printer commands will
// be written directly to the printer as raw document.
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
	return "Directly print to a attached printer. Use the Name of the printer as Endpoint."
}

func (dp *Direct) AvailableEndpoints() (map[string]string, error) {
	names, err := printer.ReadNames()
	if err != nil {
		return nil, err
	}

	available := map[string]string{}
	for i := range names {
		available[names[i]] = names[i]
	}

	return available, nil
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
