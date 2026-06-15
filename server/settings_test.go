package server

import (
	"image"
	"testing"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database/memory"
)

type testPrinter struct {
	name string
}

func (p testPrinter) Name() string {
	return p.name
}

func (p testPrinter) Description() string {
	return ""
}

func (p testPrinter) AvailableEndpoints() (map[string]string, error) {
	return map[string]string{}, nil
}

func (p testPrinter) Print(string, image.Image, []byte) error {
	return nil
}

func TestEnsureSettingsReplacesUnavailablePrinterWithDefault(t *testing.T) {
	db := memory.New()
	if err := db.SaveSettings(snd.Settings{
		PrinterType:     "Preview Printing",
		PrinterEndpoint: "window",
		PrinterWidth:    384,
	}); err != nil {
		t.Fatal(err)
	}

	defaultSettings := DefaultSettings()
	defaultSettings.PrinterType = "Android USB Printing"
	defaultSettings.PrinterEndpoint = ""

	s, err := New(db,
		WithDefaultSettings(defaultSettings),
		WithPrinter(testPrinter{name: "Android USB Printing"}),
	)
	if err != nil {
		t.Fatal(err)
	}

	if err := s.ensureSettings(); err != nil {
		t.Fatal(err)
	}

	settings, err := db.GetSettings()
	if err != nil {
		t.Fatal(err)
	}
	if settings.PrinterType != "Android USB Printing" {
		t.Fatalf("expected printer type %q, got %q", "Android USB Printing", settings.PrinterType)
	}
	if settings.PrinterEndpoint != "" {
		t.Fatalf("expected empty printer endpoint, got %q", settings.PrinterEndpoint)
	}
	if settings.PrinterWidth != 384 {
		t.Fatalf("expected printer width 384, got %d", settings.PrinterWidth)
	}
}

func TestEnsureSettingsKeepsAvailablePrinter(t *testing.T) {
	db := memory.New()
	if err := db.SaveSettings(snd.Settings{
		PrinterType:     "Preview Printing",
		PrinterEndpoint: "window",
		PrinterWidth:    384,
	}); err != nil {
		t.Fatal(err)
	}

	s, err := New(db,
		WithPrinter(testPrinter{name: "Preview Printing"}),
	)
	if err != nil {
		t.Fatal(err)
	}

	if err := s.ensureSettings(); err != nil {
		t.Fatal(err)
	}

	settings, err := db.GetSettings()
	if err != nil {
		t.Fatal(err)
	}
	if settings.PrinterType != "Preview Printing" {
		t.Fatalf("expected printer type %q, got %q", "Preview Printing", settings.PrinterType)
	}
	if settings.PrinterEndpoint != "window" {
		t.Fatalf("expected printer endpoint %q, got %q", "window", settings.PrinterEndpoint)
	}
}
