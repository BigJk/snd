// Package epson implements the protocol used by most thermal printer,
// also commonly referred to as ESC or POS commands.
package epson

import (
	"image"
	"io"
	"math"
)

// InitPrinter will re-init the printer and aborts any
// outstanding commands.
func InitPrinter(buf io.Writer) {
	_, _ = buf.Write([]byte{0x1B, 0x40, '\n'})
}

// SetStandardMode will set the printer into the standard
// mode. In this mode the printer will instantly print all
// data it receives.
func SetStandardMode(buf io.Writer) {
	_, _ = buf.Write([]byte{0x1B, 0x53, '\n'})
}

// CutPaper will cut the paper if the printer supports it.
func CutPaper(buf io.Writer) {
	_, _ = buf.Write([]byte{0x1B, 0x6D, '\n'})
}

// OpenCashDrawer1 opens cash drawer connected to pin 2.
// Uses standard pulse duration (t1=2, t2=5 which is ~100ms on, ~250ms off).
func OpenCashDrawer1(buf io.Writer) {
	_, _ = buf.Write([]byte{0x1B, 0x70, 0x00, 0x02, 0x05})
}

// OpenCashDrawer2 opens cash drawer connected to pin 5.
// Uses standard pulse duration (t1=2, t2=5 which is ~100ms on, ~250ms off).
func OpenCashDrawer2(buf io.Writer) {
	_, _ = buf.Write([]byte{0x1B, 0x70, 0x01, 0x02, 0x05})
}

// OpenCashDrawer1WithPulse opens cash drawer 1 with custom pulse duration.
// t1: ON time (0-255, each unit is approximately 50ms)
// t2: OFF time (0-255, each unit is approximately 50ms)
func OpenCashDrawer1WithPulse(buf io.Writer, t1, t2 byte) {
	_, _ = buf.Write([]byte{0x1B, 0x70, 0x00, t1, t2})
}

// OpenCashDrawer2WithPulse opens cash drawer 2 with custom pulse duration.
// t1: ON time (0-255, each unit is approximately 50ms)
// t2: OFF time (0-255, each unit is approximately 50ms)
func OpenCashDrawer2WithPulse(buf io.Writer, t1, t2 byte) {
	_, _ = buf.Write([]byte{0x1B, 0x70, 0x01, t1, t2})
}

// LineBreak adds a line break to the printer buffer.
func LineBreak(buf io.Writer) {
	_, _ = buf.Write([]byte{'\n'})
}

// Image converts a image to the printer "GS v 0: Print raster image" command
// and adds it to the printer buffer.
func Image(buf io.Writer, image image.Image) {
	bb := image.Bounds()

	height := bb.Max.Y - bb.Min.Y
	realWidth := bb.Max.X - bb.Min.X
	width := realWidth
	if width%8 != 0 {
		width += 8
	}

	xL := uint8(width % 2048 / 8)
	xH := uint8(width / 2048)
	yL := uint8(height % 256)
	yH := uint8(height / 256)

	_, _ = buf.Write([]byte{0x1d, 0x76, 0x30, 48, xL, xH, yL, yH})

	var cb byte
	var bindex byte
	for y := 0; y < height; y++ {
		for x := 0; x < int(math.Ceil(float64(realWidth)/8.0))*8; x++ {
			if x < realWidth {
				r, g, b, a := image.At(bb.Min.X+x, bb.Min.Y+y).RGBA()
				r, g, b, a = r>>8, g>>8, b>>8, a>>8

				if a > 255/2 {
					grayscale := 0.2126*float64(r) + 0.7152*float64(g) + 0.0722*float64(b)

					if grayscale < 185 {
						mask := byte(1) << byte(7-bindex)
						cb |= mask
					}
				}
			}

			bindex++
			if bindex == 8 {
				_, _ = buf.Write([]byte{cb})
				bindex = 0
				cb = 0
			}
		}
	}
}

// ImageESCStar prints using ESC * in 24-dot mode.
func ImageESCStar(buf io.Writer, img image.Image) {
	bb := img.Bounds()
	minX, minY := bb.Min.X, bb.Min.Y
	width := bb.Dx()
	height := bb.Dy()

	isBlack := func(x, y int) bool {
		r, g, b, a := img.At(minX+x, minY+y).RGBA()
		r, g, b, a = r>>8, g>>8, b>>8, a>>8
		if a <= 127 {
			return false
		}
		grey := 0.2126*float64(r) + 0.7152*float64(g) + 0.0722*float64(b)
		return grey < 185
	}

	// Set line spacing to 24 dots to match 24-dot bands: ESC 3 24
	_, _ = buf.Write([]byte{0x1B, 0x33, 24})

	for y := 0; y < height; y += 24 {
		// ESC * m nL nH, m=33 (24-dot double density)
		n := width
		nL := byte(n & 0xFF)
		nH := byte((n >> 8) & 0xFF)
		_, _ = buf.Write([]byte{0x1B, 0x2A, 33, nL, nH})

		for x := 0; x < width; x++ {
			var b0, b1, b2 byte
			for bit := 0; bit < 8; bit++ {
				yy := y + bit
				if yy < height && isBlack(x, yy) {
					b0 |= 1 << (7 - uint(bit))
				}
			}
			for bit := 0; bit < 8; bit++ {
				yy := y + 8 + bit
				if yy < height && isBlack(x, yy) {
					b1 |= 1 << (7 - uint(bit))
				}
			}
			for bit := 0; bit < 8; bit++ {
				yy := y + 16 + bit
				if yy < height && isBlack(x, yy) {
					b2 |= 1 << (7 - uint(bit))
				}
			}
			_, _ = buf.Write([]byte{b0, b1, b2})
		}

		// Advance exactly one band (24 dots): LF because we set line spacing=24
		_, _ = buf.Write([]byte{0x0A})
	}

	// Restore default line spacing: ESC 2
	_, _ = buf.Write([]byte{0x1B, 0x32})
}
