package cups

import (
	"errors"
	"fmt"
	"image"
	"image/png"
	"io/ioutil"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

type CUPSImage struct{}

func (c *CUPSImage) Name() string {
	return "CUPS Image Printing"
}

func (c *CUPSImage) Description() string {
	return "Print as image via CUPS attached printer. Endpoint format: PRINTER_NAME:WIDTH_MM where WIDTH_MM is the paper width in millimeters. The height is automatically calculated based on image aspect ratio."
}

func (c *CUPSImage) AvailableEndpoints() (map[string]string, error) {
	output, err := exec.Command("lpstat", "-s").CombinedOutput()
	if err != nil {
		return nil, err
	}

	found := devicesRegex.FindAllStringSubmatch(string(output), -1)
	available := map[string]string{}
	for i := range found {
		available[found[i][1]] = found[i][1] + ":80"
	}

	return available, nil
}

// parseEndpoint parses the printer endpoint in format "PRINTER_NAME:WIDTH_MM"
// and returns the printer name and width in millimeters
func parseEndpoint(printerEndpoint string) (string, float64, error) {
	split := strings.Split(printerEndpoint, ":")
	if len(split) != 2 {
		return "", 0, errors.New("wrong endpoint syntax, expected format: PRINTER_NAME:WIDTH_MM")
	}

	printerName := split[0]
	width, err := strconv.ParseFloat(split[1], 64)
	if err != nil {
		return "", 0, fmt.Errorf("invalid width value: %w", err)
	}

	if width <= 0 {
		return "", 0, errors.New("width must be greater than 0")
	}

	return printerName, width, nil
}

// calculateHeight calculates the target height in millimeters based on image aspect ratio
func calculateHeight(img image.Image, widthMM float64) float64 {
	bounds := img.Bounds()
	imgWidth := float64(bounds.Dx())
	imgHeight := float64(bounds.Dy())

	if imgWidth <= 0 {
		return widthMM
	}

	aspectRatio := imgHeight / imgWidth
	return widthMM * aspectRatio
}

func (c *CUPSImage) Print(printerEndpoint string, img image.Image, data []byte) error {
	printerName, widthMM, err := parseEndpoint(printerEndpoint)
	if err != nil {
		return err
	}

	heightMM := calculateHeight(img, widthMM)
	file, err := ioutil.TempFile("", "print_*.png")
	if err != nil {
		return err
	}

	defer func() {
		_ = os.Remove(file.Name())
	}()
	defer file.Close()

	if err := png.Encode(file, img); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	if err := file.Close(); err != nil {
		return err
	}

	mediaSize := fmt.Sprintf("Custom.%.0fx%.0fmm", widthMM, heightMM)
	cmd := exec.Command("lp", "-d", printerName, "-o", "fit-to-page", "-o", fmt.Sprintf("media=%s", mediaSize), file.Name())
	return cmd.Run()
}
