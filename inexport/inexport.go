package inexport

import (
	"errors"
	"fmt"
	"regexp"
)

// ImportReader represents an arbitrary file reader that can be used
// to import templates and sources.
type ImportReader interface {
	ReadFile(string) ([]byte, error)
}

func readFiles(reader ImportReader, files []string) (map[string][]byte, error) {
	res := map[string][]byte{}
	for i := range files {
		data, err := reader.ReadFile(files[i])
		if err != nil {
			return nil, errors.New(fmt.Sprintf("can't read file %s (%s)", files[i], err))
		}
		res[files[i]] = data
	}
	return res, nil
}

// ExportWriter represents an arbitrary file writer that can be used
// to export templates and sources.
type ExportWriter interface {
	WriteFile(string, []byte) error
}

func writeFiles(writer ExportWriter, files map[string][]byte) error {
	for file, data := range files {
		if err := writer.WriteFile(file, data); err != nil {
			return errors.New(fmt.Sprintf("can't write file %s (%s)", file, err))
		}
	}
	return nil
}

// validChars represents valid characters for author and slug.
// Valid: a-z, A-Z, 0-9 and -
var validChars = regexp.MustCompile(`^[a-zA-Z0-9\-]+$`)
