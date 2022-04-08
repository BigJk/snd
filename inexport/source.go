package inexport

import (
	"encoding/json"
	"errors"
	"github.com/BigJk/snd"
)

// ImportSource imports a data source from a given ImportReader interface instance.
//
// Following files are needed:
// - meta.json
// - entries.json
func ImportSource(reader ImportReader) (snd.DataSource, []snd.Entry, error) {
	files, err := readFiles(reader, []string{"meta.json", "entries.json"})
	if err != nil {
		return snd.DataSource{}, nil, err
	}

	var ds snd.DataSource
	if err := json.Unmarshal(files["meta.json"], &ds); err != nil {
		return snd.DataSource{}, nil, err
	}

	if len(ds.Slug) == 0 || len(ds.Author) == 0 || len(ds.Name) == 0 {
		return snd.DataSource{}, nil, errors.New("meta data incomplete (e.g. name, author, slug missing)")
	}

	if !validChars.MatchString(ds.Slug) || !validChars.MatchString(ds.Author) {
		return snd.DataSource{}, nil, errors.New("slug or author contains illegal characters")
	}

	var entries []snd.Entry
	if err := json.Unmarshal(files["entries.json"], &entries); err != nil {
		return snd.DataSource{}, nil, err
	}

	return ds, entries, nil
}
