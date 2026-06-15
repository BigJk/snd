// Package mobile exposes a gomobile-friendly entry point for the Android host.
package mobile

import (
	"errors"
	"math/rand"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/BigJk/snd/database/badger"
	"github.com/BigJk/snd/printing/androidbt"
	"github.com/BigJk/snd/printing/androidusb"
	"github.com/BigJk/snd/printing/dump"
	"github.com/BigJk/snd/printing/remote"
	"github.com/BigJk/snd/rendering"
	"github.com/BigJk/snd/server"
)

type Server struct {
	mu     sync.Mutex
	data   string
	bridge USBBridge
	bt     BluetoothBridge
	render RendererBridge
	picker FilePickerBridge
	server *server.Server
}

type USBBridge interface {
	AvailableEndpointsJSON() (string, error)
	Print(endpoint string, data []byte) error
}

type BluetoothBridge interface {
	AvailableEndpointsJSON() (string, error)
	Print(endpoint string, data []byte) error
}

type RendererBridge interface {
	RenderURL(url string, width int32) ([]byte, error)
	ExtractHTML(url string, selector string) (string, error)
}

type FilePickerBridge interface {
	PickFile(fileEndingsJSON string) (string, error)
	PickFolder() (string, error)
	SaveFile(fileName string, mimeType string, data []byte) error
}

func NewServer(dataDir string, bridge USBBridge) *Server {
	return &Server{
		data:   dataDir,
		bridge: bridge,
	}
}

func NewServerWithRenderer(dataDir string, bridge USBBridge, renderer RendererBridge) *Server {
	return &Server{
		data:   dataDir,
		bridge: bridge,
		render: renderer,
	}
}

func NewServerWithBridges(dataDir string, bridge USBBridge, renderer RendererBridge, picker FilePickerBridge) *Server {
	return &Server{
		data:   dataDir,
		bridge: bridge,
		render: renderer,
		picker: picker,
	}
}

func NewServerWithAndroidBridges(
	dataDir string,
	bridge USBBridge,
	bt BluetoothBridge,
	renderer RendererBridge,
	picker FilePickerBridge,
) *Server {
	return &Server{
		data:   dataDir,
		bridge: bridge,
		bt:     bt,
		render: renderer,
		picker: picker,
	}
}

func (s *Server) Start(bindAddr string, debug bool) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server != nil {
		return errors.New("server is already running")
	}

	if bindAddr == "" {
		bindAddr = "127.0.0.1:7123"
	}
	if s.data == "" {
		s.data = "."
	}

	if err := os.MkdirAll(s.data, 0777); err != nil {
		return err
	}
	if err := os.Chdir(s.data); err != nil {
		return err
	}
	rendering.SetAndroidRenderer(s.render)

	db, err := badger.New(filepath.Join(s.data, "userdata"))
	if err != nil {
		return err
	}

	rand.Seed(time.Now().UnixNano())

	defaultSettings := server.DefaultSettings()
	defaultSettings.PrinterType = androidusb.PrinterName
	defaultSettings.PrinterEndpoint = ""

	srv, err := server.New(db,
		server.WithDataDir(s.data),
		server.WithDebug(debug),
		server.WithDefaultSettings(defaultSettings),
		server.WithPrinter(androidusb.New(s.bridge)),
		server.WithPrinter(androidbt.New(s.bt)),
		server.WithPrinter(&remote.Remote{}),
		server.WithPrinter(&dump.Dump{}),
		server.WithFilePicker(s.picker),
	)
	if err != nil {
		_ = db.Close()
		return err
	}

	s.server = srv

	go func() {
		if err := srv.Start(bindAddr); err != nil {
			// Echo returns an error when Shutdown closes the listener. The Android
			// host controls lifecycle through Stop, so there is no UI to report to here.
		}
	}()

	return nil
}

func (s *Server) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.server == nil {
		return nil
	}

	err := s.server.Close()
	s.server = nil
	return err
}
