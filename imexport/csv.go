package imexport

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"github.com/BigJk/snd"
)

type csvReaderWrapper struct {
	ds      []byte
	entries []byte
}

func (r *csvReaderWrapper) ReadFile(s string) ([]byte, error) {
	switch s {
	case "meta.json":
		return r.ds, nil
	case "entries.json":
		return r.entries, nil
	}
	return nil, errors.New("not found")
}

// ImportDataSourceCSV will import a data source and entry data from a given csv file.
//
// It expects the csv files to have a header with the basic information in the first two lines
// and after that the header with value names and values, example:
//
//   Name, Author, Slug, Description
//   Cool Source, BigJk, cool-source, This is a cool source
//   Name, Price, Weight
//   Sword, 10gp, 10lb
//   Mace, 22gp, 12lb
//   ...
func ImportDataSourceCSV(reader io.Reader) (snd.DataSource, []snd.Entry, error) {
	csvReader := csv.NewReader(reader)
	csvReader.FieldsPerRecord = -1

	metaHeader, err := csvReader.Read()
	if err != nil && err != csv.ErrFieldCount || len(metaHeader) < 4 {
		return snd.DataSource{}, nil, errors.New(fmt.Sprintf("header not present or incomplete (%s)", err))
	}

	metaValues, err := csvReader.Read()
	if err != nil && err != csv.ErrFieldCount || len(metaValues) < 4 {
		return snd.DataSource{}, nil, errors.New(fmt.Sprintf("meta values (name, author, description, slug etc.) not fully present (%s)", err))
	}

	ds := snd.DataSource{
		Name:        metaValues[0],
		Slug:        metaValues[2],
		Author:      metaValues[1],
		Description: metaValues[3],
		Version:     "",
	}

	valueHeaders, err := csvReader.Read()
	if err != nil && err != csv.ErrFieldCount {
		return snd.DataSource{}, nil, errors.New(fmt.Sprintf("header for values not present (%s)", err))
	}

	csvReader.FieldsPerRecord = len(valueHeaders)
	values, err := csvReader.ReadAll()
	if err != nil && err != csv.ErrFieldCount {
		return snd.DataSource{}, nil, errors.New(fmt.Sprintf("values can't be read (%s)", err))
	}

	var entries []snd.Entry
	for i := range values {
		if len(values[i]) == 0 {
			continue
		}

		data := map[string]interface{}{}
		name := ""

		for j := range values[i] {
			if j >= len(valueHeaders) || len(valueHeaders[j]) == 0 {
				break
			}

			if strings.ToLower(valueHeaders[j]) == "Name" {
				name = valueHeaders[j]
			}

			data[valueHeaders[j]] = values[i][j]
		}

		// if no name is found fall back to just index
		if len(name) == 0 {
			name = fmt.Sprint(i)
		}

		entries = append(entries, snd.Entry{
			ID:   fmt.Sprint(i),
			Name: name,
			Data: data,
		})
	}

	dsBytes, _ := json.Marshal(ds)
	entriesBytes, _ := json.Marshal(entries)

	return ImportSource(&csvReaderWrapper{
		ds:      dsBytes,
		entries: entriesBytes,
	})
}
