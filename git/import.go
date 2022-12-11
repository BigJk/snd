package git

import (
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/go-git/go-billy/v5"
)

type ImportReaderFS struct {
	Folder string
	FS     billy.Filesystem
}

func (ir ImportReaderFS) ReadFile(s string) ([]byte, error) {
	file, err := ir.FS.OpenFile(filepath.Join(ir.Folder, s), os.O_RDONLY, 0666)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	return ioutil.ReadAll(file)
}
