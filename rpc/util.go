package rpc

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
)

func convertTo1BitPNG(img image.Image) ([]byte, error) {
	// Create a black and white palette (1-bit)
	palette := color.Palette{
		color.White,
		color.Black,
	}

	// Create a new Paletted image with the same dimensions as the source image
	bounds := img.Bounds()
	dstImg := image.NewPaletted(bounds, palette)

	// Convert the source image to 1-bit black and white
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			// Get the color at (x, y)
			originalColor := img.At(x, y)

			// Convert to grayscale to decide if it's black or white
			grayColor := color.GrayModel.Convert(originalColor).(color.Gray)
			if grayColor.Y > 128 {
				dstImg.SetColorIndex(x, y, 0) // Set white
			} else {
				dstImg.SetColorIndex(x, y, 1) // Set black
			}
		}
	}

	// Create a buffer to write the PNG data
	var buf bytes.Buffer

	// Encode the new paletted image as PNG and write to the buffer
	err := png.Encode(&buf, dstImg)
	if err != nil {
		return nil, err
	}

	// Return the buffer's bytes and nil error
	return buf.Bytes(), nil
}
