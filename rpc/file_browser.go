package rpc

import (
	"github.com/BigJk/nra"
	"github.com/labstack/echo/v4"
	"os"
	"path/filepath"
)

func RegisterFileBrowser(route *echo.Group) {
	type FileInfo struct {
		Name     string `json:"name"`
		FullPath string `json:"fullPath"`
		IsDir    bool   `json:"isDir"`
	}

	route.POST("/getFiles", echo.WrapHandler(nra.MustBind(func(path string, endings []string, onlyDirs bool) ([]FileInfo, error) {
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
	})))

	route.POST("/getDefaultDirectories", echo.WrapHandler(nra.MustBind(func() (map[string]string, error) {
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
	})))
}
