// Package windows provides printing for Sales & Dungeons
// via direct printing on windows. The printer commands will
// be written directly to the printer as raw document.
package windows

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/alexbrainman/printer"
)

type Image struct{}

func (dp *Image) Name() string {
	return "Windows Image Printing"
}

func (dp *Image) Description() string {
	return "Print as image to a attached printer. Use the Name of the printer as endpoint. Can be used for label printing. Make sure to setup the right paper size in the printer driver."
}

func (dp *Image) AvailableEndpoints() (map[string]string, error) {
	names, err := printer.ReadNames()
	if err != nil {
		return nil, err
	}

	available := map[string]string{}
	for i := range names {
		available[names[i]] = names[i]
	}

	return available, nil
}

func printPNGWithPowerShell(imagePath, printerName string) error {
	imgAbs, err := filepath.Abs(imagePath)
	if err != nil {
		return fmt.Errorf("abs image path: %w", err)
	}

	psScript := `
param(
  [Parameter(Mandatory = $true)][string]$ImagePath,
  [Parameter(Mandatory = $true)][string]$PrinterName
)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($ImagePath)
$pd = New-Object System.Drawing.Printing.PrintDocument
$pd.PrinterSettings.PrinterName = $PrinterName
$pd.OriginAtMargins = $false
$pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
$pd.PrintController = New-Object System.Drawing.Printing.StandardPrintController

$pd.add_PrintPage({
    param($sender, $e)

    $page = $e.PageBounds

    # Image size
    $iw = [double]$img.Width
    $ih = [double]$img.Height

    # Page size (device units)
    $pw = [double]$page.Width
    $ph = [double]$page.Height

    $scale = $pw / $iw
    $dw = [int]$pw
    $dh = [int]([Math]::Round($ih * $scale))

    $dx = $page.X
    $dy = $page.Y

    $e.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $e.Graphics.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $e.Graphics.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $e.Graphics.CompositingQuality= [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $e.Graphics.DrawImage($img, $dx, $dy, $dw, $dh)
})

try {
    $pd.Print()
}
finally {
    if ($img) { $img.Dispose() }
    if ($pd)  { $pd.Dispose() }
}
`
	execPath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("get executable path: %w", err)
	}

	scriptPath := filepath.Join(filepath.Dir(execPath), "print_image.ps1")
	if err := os.WriteFile(scriptPath, []byte(psScript), 0644); err != nil {
		return fmt.Errorf("create script file: %w", err)
	}

	cmd := exec.Command(
		"powershell.exe",
		"-NoProfile",
		"-NonInteractive",
		"-ExecutionPolicy", "Bypass",
		"-File", scriptPath,
		imgAbs,
		printerName,
	)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("powershell failed: %v\nOutput:\n%s", err, string(out))
	}

	return nil
}

func (dp *Image) Print(printerEndpoint string, img image.Image, data []byte) error {
	file, err := ioutil.TempFile("", "print_*.png")
	if err != nil {
		return err
	}

	padding := 30
	bounds := img.Bounds()
	paddedImg := image.NewRGBA(image.Rect(0, 0, bounds.Dx()+padding*2, bounds.Dy()+padding*2))

	white := color.RGBA{255, 255, 255, 255}
	for y := 0; y < paddedImg.Bounds().Dy(); y++ {
		for x := 0; x < paddedImg.Bounds().Dx(); x++ {
			paddedImg.Set(x, y, white)
		}
	}

	draw.Draw(paddedImg, image.Rect(padding, padding, bounds.Dx()+padding, bounds.Dy()+padding), img, bounds.Min, draw.Src)

	defer func() {
		_ = os.Remove(file.Name())
	}()
	defer file.Close()

	if err := png.Encode(file, paddedImg); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	if err := file.Close(); err != nil {
		return err
	}

	return printPNGWithPowerShell(file.Name(), printerEndpoint)
}
