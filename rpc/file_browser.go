package rpc

import (
	"encoding/json"
	"errors"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
	"os"
	"path/filepath"
)

type FilePicker interface {
	PickFile(fileEndingsJSON string) (string, error)
	PickFolder() (string, error)
	SaveFile(fileName string, mimeType string, data []byte) error
}

func RegisterFileBrowser(route *echo.Group, picker FilePicker) {
	type FileInfo struct {
		Name     string `json:"name"`
		FullPath string `json:"fullPath"`
		IsDir    bool   `json:"isDir"`
	}

	bind.MustBind(route, "/getFiles", func(path string, endings []string, onlyDirs bool) ([]FileInfo, error) {
		files, err := os.ReadDir(path)
		if err != nil {
			return nil, err
		}

		var result []FileInfo
		for _, file := range files {
			info := FileInfo{
				Name:     file.Name(),
				FullPath: filepath.Join(path, file.Name()),
				IsDir:    file.IsDir(),
			}

			if !info.IsDir && onlyDirs {
				continue
			}

			if !info.IsDir && len(endings) > 0 {
				for _, ending := range endings {
					if filepath.Ext(info.Name) == ending {
						result = append(result, info)
						break
					}
				}
				continue
			}

			result = append(result, info)
		}

		return result, nil
	})

	bind.MustBind(route, "/getDefaultDirectories", func() (map[string]string, error) {
		home, err := os.UserHomeDir()
		if err != nil {
			return nil, err
		}

		exec, err := os.Executable()
		if err != nil {
			return nil, err
		}

		return map[string]string{
			"User":             home,
			"Documents":        filepath.Join(home, "Documents"),
			"Downloads":        filepath.Join(home, "Downloads"),
			"Pictures":         filepath.Join(home, "Pictures"),
			"Sales & Dungeons": filepath.Dir(exec),
		}, nil
	})

	bind.MustBind(route, "/hasNativeFilePicker", func() (bool, error) {
		return picker != nil, nil
	})

	bind.MustBind(route, "/pickFile", func(endings []string) (string, error) {
		if picker == nil {
			return "", errors.New("native file picker is not available")
		}

		data, err := json.Marshal(endings)
		if err != nil {
			return "", err
		}

		return picker.PickFile(string(data))
	})

	bind.MustBind(route, "/pickFolder", func() (string, error) {
		if picker == nil {
			return "", errors.New("native folder picker is not available")
		}

		return picker.PickFolder()
	})

	bind.MustBind(route, "/saveFileNative", func(fileName string, mimeType string, data []byte) error {
		if picker == nil {
			return errors.New("native save dialog is not available")
		}

		return picker.SaveFile(fileName, mimeType, data)
	})
}
