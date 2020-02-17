package epson

import (
	"image"
	"io"
	"math"
)

// LineBreak adds a line break to the printer buffer.
func LineBreak(buf io.Writer) {
	_, _ = buf.Write([]byte{'\n'})
}

// Image converts a image to the printer "GS v 0: Print raster image" command
// and adds it to the printer buffer.
func Image(buf io.Writer, image image.Image) {
	bb := image.Bounds()

	width := bb.Max.X
	if width%8 != 0 {
		width += 8
	}

	xL := uint8(width % 2048 / 8)
	xH := uint8(width / 2048)
	yL := uint8(bb.Max.Y % 256)
	yH := uint8(bb.Max.Y / 256)

	_, _ = buf.Write([]byte{0x1d, 0x76, 0x30, 48, xL, xH, yL, yH})

	var cb byte
	var bindex byte
	for y := 0; y < bb.Max.Y; y++ {
		for x := 0; x < int(math.Ceil(float64(bb.Max.X)/8.0))*8; x++ {
			if x > bb.Max.X {
				bindex++
				if bindex == 8 {
					_, _ = buf.Write([]byte{cb})
					bindex = 0
					cb = 0
				}
				continue
			}

			r, g, b, a := image.At(x, y).RGBA()
			r, g, b, a = r>>8, g>>8, b>>8, a>>8

			if a > 255/2 {
				grayscale := 0.2126*float64(r) + 0.7152*float64(g) + 0.0722*float64(b)

				if grayscale < 128 {
					mask := byte(1) << byte(7-bindex)
					cb |= mask
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
