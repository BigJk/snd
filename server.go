package snd

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"

	"github.com/BigJk/snd/printing"

	"github.com/asdine/storm"
	"github.com/labstack/echo"
)

// ServerOption
type ServerOption func(s *Server) error

// ServerPossiblePrinters
type ServerPossiblePrinter map[string]printing.Printer

// Server represents a instance of the S&D server.
type Server struct {
	sync.RWMutex
	db           *storm.DB
	e            *echo.Echo
	scriptEngine *ScriptEngine
	printers     ServerPossiblePrinter
}

// ImageCache represents a image that was cached through the image proxy.
type ImageCache struct {
	ContentType string
	Base        string
}

// NewServer creates a new instance of the S&D server.
func NewServer(file string, options ...ServerOption) (*Server, error) {
	db, err := storm.Open(file)
	if err != nil {
		return nil, err
	}

	s := &Server{
		db:       db,
		e:        echo.New(),
		printers: map[string]printing.Printer{},
	}

	for i := range options {
		if err := options[i](s); err != nil {
			return nil, err
		}
	}

	return s, nil
}

func WithPrinter(printer printing.Printer) ServerOption {
	return func(s *Server) error {
		s.printers[printer.Name()] = printer
		return nil
	}
}

func (s *Server) Start(bind string) error {
	// Create default settings if not existing
	var settings Settings
	if err := s.db.Get("base", "settings", &settings); err == storm.ErrNotFound {
		if err := s.db.Set("base", "settings", &Settings{
			PrinterEndpoint: "http://127.0.0.1:3000",
			Stylesheets:     []string{},
		}); err != nil {
			return err
		}
	}

	// Create script engine
	s.scriptEngine = NewScriptEngine(AttachScriptRuntime(s.db))

	// Register rpc routes
	RegisterRPC(s.e.Group("/api"), s.db, s.scriptEngine, s.printers)

	// Register image proxy route so that the iframes that are used
	// in the frontend can proxy images that they otherwise couldn't
	// access because of CORB
	s.e.GET("/image-proxy", func(c echo.Context) error {
		url := c.QueryParam("url")

		var image ImageCache
		if s.db.Get("images", url, &image) == storm.ErrNotFound {
			resp, err := http.Get(url)
			if err != nil || resp.StatusCode != http.StatusOK {
				return c.NoContent(http.StatusBadRequest)
			}

			data, err := ioutil.ReadAll(resp.Body)
			if err != nil {
				return c.NoContent(http.StatusBadRequest)
			}

			image.ContentType = resp.Header.Get("Content-Type")
			image.Base = base64.StdEncoding.EncodeToString(data)

			_ = s.db.Set("images", url, &image)
			_ = resp.Body.Close()
			return c.Blob(http.StatusOK, resp.Header.Get("Content-Type"), data)
		}

		imgData, err := base64.StdEncoding.DecodeString(image.Base)
		if err != nil {
			return c.NoContent(http.StatusBadRequest)
		}

		return c.Blob(http.StatusOK, image.ContentType, imgData)
	})

	// Make frontend and static directory public
	s.e.Static("/", "./frontend/dist")
	s.e.Static("/static", "./static")

	s.e.HideBanner = true
	s.e.HidePort = true

	fmt.Println(`
   _____        _____  
  / ____| ___  |  __ \ 
 | (___  ( _ ) | |  | |
  \___ \ / _ \/\ |  | |
  ____) | (_>  < |__| |
 |_____/ \___/\/_____/ 
________________________________________`)
	if len(GitCommitHash) > 0 {
		fmt.Println("Build Time    :", BuildTime)
		fmt.Println("Commit Branch :", GitBranch)
		fmt.Println("Commit Hash   :", GitCommitHash)
	}

	return s.e.Start(bind)
}
