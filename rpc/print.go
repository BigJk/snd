package rpc

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"image/png"
	"io/ioutil"
	"math"
	"math/rand"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/BigJk/snd/rpc/bind"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/patrickmn/go-cache"

	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rendering"
	"github.com/BigJk/snd/thermalprinter/epson"
	"github.com/PuerkitoBio/goquery"
	"github.com/labstack/echo/v4"
)

// GetOutboundIP gets the local ip.
func GetOutboundIP() (net.IP, error) {
	return net.IPv4(127, 0, 0, 1), nil
}

// urlRegex is used to find URLs in CSS.
var urlRegex = regexp.MustCompile(`(?U)url\(["']?(.+)\)`)

// renderCache is used to cache rendered HTML.
var renderCache = cache.New(time.Second*30, time.Minute)

// fixHtml fixes the HTML string by converting the relative URLs to absolute ones
// and adding the html and body tags.
func fixHtml(html string, settings snd.Settings) (string, error) {
	// Get local outbound ip
	ip, err := GetOutboundIP()
	if err != nil {
		return "", err
	}

	// Generate html
	htmlHead := `<!DOCTYPE html>
<html lang="en">
  <title>print page</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body { margin: 0; padding: 0; }</style>
  <body>
		<div id="content">`

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlHead + html + "</div></body></html>"))
	if err != nil {
		return "", log.ErrorUser(err, "html parsing failed")
	}

	// Convert relative image urls to absolute ones
	doc.Find("img").Each(func(i int, s *goquery.Selection) {
		url := s.AttrOr("src", "")

		if !strings.HasPrefix(url, "http") && !strings.HasPrefix(url, "data:") {
			url = "http://" + ip.String() + ":7123/" + strings.TrimLeft(url, "/")
			s.SetAttr("src", url)
		}
	})

	finalHtml, err := doc.Html()
	if err != nil {
		return "", log.ErrorUser(err, "html rendering failed")
	}

	// Find CSS url() usage and convert relative urls to absolute ones
	finalHtml = urlRegex.ReplaceAllStringFunc(finalHtml, func(s string) string {
		match := urlRegex.FindStringSubmatch(s)

		content := strings.Replace(match[1][1:], "#39;", "'", -1)
		symbol := ""

		switch content[len(content)-1] {
		case '"':
			fallthrough
		case '\'':
			symbol = content[len(content)-1:]
		}

		content = strings.TrimLeft(content, symbol+"/")

		if strings.HasPrefix(content, "data:") || strings.HasPrefix(content, "http") {
			return s
		}

		return fmt.Sprintf("url(%s%s%s%s%s)", symbol, "http://", ip, ":7123/", strings.TrimLeft(content, symbol+"/"))
	})

	return finalHtml, nil
}

// print will render the HTML to a image and print it on the target printer.
func print(db database.Database, printer printing.PossiblePrinter, html string) error {
	// Get current settings
	settings, err := db.GetSettings()
	if err != nil {
		return err
	}

	if settings.PrinterWidth < 50 {
		return errors.New("print width is too low")
	}

	// Get printer
	selectedPrinter, ok := printer[settings.PrinterType]
	if !ok {
		return fmt.Errorf("printer nout found: %w", err)
	}

	finalHtml, err := fixHtml(html, settings)
	if err != nil {
		return fmt.Errorf("error while fixing html: %w", err)
	}

	// Save rendered html to temporary cache
	tempId := fmt.Sprint(rand.Int63())
	renderCache.SetDefault(tempId, finalHtml)

	// Render the html to image
	renderedImage, err := rendering.RenderURL(fmt.Sprintf("http://127.0.0.1:7123/api/html/%s", tempId), settings.PrinterWidth)
	if err != nil {
		return fmt.Errorf("html to image rendering failed: %w", err)
	}

	imageRgb := renderedImage.(*image.RGBA)
	height := imageRgb.Bounds().Max.Y
	width := imageRgb.Bounds().Max.X

	var images []image.Image
	if settings.Commands.SplitPrinting && height > settings.Commands.SplitHeight {
		if settings.Commands.SplitHeight < 100 {
			return fmt.Errorf("please use a split height of at least 100")
		}

		chunks := int(math.Ceil(float64(height) / float64(settings.Commands.SplitHeight)))

		// Chunk the images
		for i := 0; i < chunks; i++ {
			y1 := i * settings.Commands.SplitHeight
			y2 := y1 + settings.Commands.SplitHeight
			if y2 > height {
				y2 = height
			}

			images = append(images, imageRgb.SubImage(image.Rect(0, y1, width, y2)))
		}
	} else {
		images = []image.Image{renderedImage}
	}

	// Print
	for i, img := range images {
		buf := &bytes.Buffer{}

		// At the first chunk set modes and lines
		if i == 0 {
			if settings.Commands.ExplicitInit {
				epson.InitPrinter(buf)
			}

			if settings.Commands.ForceStandardMode {
				epson.SetStandardMode(buf)
			}

			buf.WriteString(strings.Repeat("\n", settings.Commands.LinesBefore))
		}

		epson.Image(buf, img)

		// At the last chunk insert lines and cut
		if i == len(images)-1 {
			buf.WriteString(strings.Repeat("\n", 5+settings.Commands.LinesAfter))

			if settings.Commands.Cut {
				epson.CutPaper(buf)
			}
		}

		// Print chunk
		err = selectedPrinter.Print(settings.PrinterEndpoint, renderedImage, buf.Bytes())
		if err != nil {
			return fmt.Errorf("printer wasn't able to print: %w", err)
		}

		// Add delay to consecutive prints
		if len(images) > 1 && settings.Commands.SplitDelay > 0 {
			time.Sleep(time.Millisecond * time.Duration(settings.Commands.SplitDelay))
		}
	}

	return nil
}

// hashObject will hash the given object and return the hash as a string.
func hashObject(data any) (string, error) {
	json, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	hash := sha256.New()
	hash.Write(json)
	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}

func RegisterPrint(route *echo.Group, extern *echo.Group, db database.Database, printer printing.PossiblePrinter) {
	route.GET("/html/:id", func(c echo.Context) error {
		val, ok := renderCache.Get(c.Param("id"))
		if !ok {
			return c.NoContent(http.StatusNotFound)
		}

		return c.HTML(http.StatusOK, val.(string))
	})

	bind.MustBind(route, "/getPrinter", func() (map[string]string, error) {
		printerNames := map[string]string{}

		for k, v := range printer {
			printerNames[k] = v.Description()
		}

		return printerNames, nil
	})

	bind.MustBind(route, "/getAvailablePrinter", func() (map[string]map[string]string, error) {
		available := map[string]map[string]string{}

		for k, v := range printer {
			a, err := v.AvailableEndpoints()
			if err != nil {
				_ = log.Error(err, log.WithValue("printer", k))
			}
			available[k] = a
		}

		return available, nil
	})

	bind.MustBind(route, "/print", func(html string) error {
		return print(db, printer, html)
	})

	externPrintTemplate := func(tmplId string, entry any, config any) error {
		entryJson, err := json.Marshal(entry)
		if err != nil {
			return err
		}

		configJson, err := json.Marshal(config)
		if err != nil {
			return err
		}

		html, err := rendering.ExtractHTML(fmt.Sprintf("http://127.0.0.1:7123/#!/extern-print/template/%s/%s/%s", tmplId, base64.StdEncoding.EncodeToString(entryJson), base64.StdEncoding.EncodeToString(configJson)), "#render-done")
		if err != nil {
			return err
		}

		if err := print(db, printer, html); err != nil {
			return err
		}

		return nil
	}

	bind.MustBind(route, "/printTemplate", func(id string, entry snd.Entry, config map[string]any) error {
		_, err := db.GetTemplate(id)
		if err != nil {
			return err
		}
		return externPrintTemplate(id, entry, config)
	})

	bind.MustBind(route, "/printTemplateEntry", func(id string, eid string, config map[string]any) error {
		tmpl, err := db.GetTemplate(id)
		if err != nil {
			return err
		}

		ent, err := db.GetEntry(id, eid)
		if err != nil {
			// Try to find the entry in the linked data sources
			for _, dsid := range tmpl.DataSources {
				if ds, err := db.GetSource(dsid); err == nil {
					if ent, err = db.GetEntry(ds.ID(), eid); err == nil {
						return externPrintTemplate(id, ent, config)
					}
				}
			}

			return err
		}

		return externPrintTemplate(id, ent, config)
	})

	externPrintGenerator := func(genId string, config map[string]any) error {
		configJson, err := json.Marshal(config)
		if err != nil {
			return err
		}

		html, err := rendering.ExtractHTML(fmt.Sprintf("http://127.0.0.1:7123/#!/extern-print/generator/%s/%s", genId, base64.StdEncoding.EncodeToString(configJson)), "#render-done")
		if err != nil {
			return err
		}

		if err := print(db, printer, html); err != nil {
			return err
		}

		return nil
	}

	bind.MustBind(route, "/printGenerator", func(id string, config map[string]any) error {
		_, err := db.GetGenerator(id)
		if err != nil {
			return err
		}
		return externPrintGenerator(id, config)
	})

	bind.MustBind(route, "/screenshot", func(html string, file string) error {
		// Get current settings
		settings, err := db.GetSettings()
		if err != nil {
			return err
		}

		if settings.PrinterWidth < 50 {
			return log.ErrorString("print width is too low", log.WithValue("width", settings.PrinterWidth))
		}

		finalHtml, err := fixHtml(html, settings)
		if err != nil {
			return err
		}

		// Save rendered html to temporary cache
		tempId := fmt.Sprint(rand.Int63())
		renderCache.SetDefault(tempId, finalHtml)

		img, err := rendering.RenderURL(fmt.Sprintf("http://127.0.0.1:7123/api/html/%s", tempId), settings.PrinterWidth)
		if err != nil {
			return err
		}

		buf := &bytes.Buffer{}
		if err := png.Encode(buf, img); err != nil {
			return err
		}

		return ioutil.WriteFile(file, buf.Bytes(), 0666)
	})

	bind.MustBind(route, "/previewCache", func(id string, html string) (string, error) {
		renderCache.SetDefault(id, html)
		return fmt.Sprintf("http://127.0.0.1:7123/api/html/%s", id), nil
	})

	previewImageMutex := sync.Mutex{}
	route.GET("/preview-image/:id", func(c echo.Context) error {
		// Lock the mutex to prevent too many requests at once
		previewImageMutex.Lock()
		defer previewImageMutex.Unlock()

		id := c.Param("id")
		html := ""
		cacheKey := ""

		if strings.HasPrefix(id, "tmpl:") {
			tmpl, err := db.GetTemplate(id)
			if err != nil {
				return err
			}

			if hash, err := hashObject(tmpl); err == nil {
				cacheKey = fmt.Sprintf("PIMG_%s_%s", id, hash)
				if data, err := db.GetKey(cacheKey); err == nil {
					if bytes, err := base64.StdEncoding.DecodeString(data); err == nil {
						fmt.Println("Cache hit", cacheKey, id)
						return c.Blob(http.StatusOK, "image/jpeg", bytes)
					}
				}
			}

			entryJson, err := json.Marshal(map[string]any{
				"id":   "skeleton",
				"name": "Skeleton",
				"data": tmpl.SkeletonData,
			})
			if err != nil {
				return err
			}
			tmplHtml, err := rendering.ExtractHTML(fmt.Sprintf("http://127.0.0.1:7123/#!/extern-print/template/%s/%s/%s", id, base64.StdEncoding.EncodeToString(entryJson), base64.StdEncoding.EncodeToString([]byte("{}"))), "#render-done")
			if err != nil {
				return err
			}
			html = tmplHtml

		} else if strings.HasPrefix(id, "gen:") {
			gen, err := db.GetGenerator(id)
			if err != nil {
				return err
			}

			if hash, err := hashObject(gen); err == nil {
				cacheKey = fmt.Sprintf("PIMG_%s_%s", id, hash)
				if data, err := db.GetKey(cacheKey); err == nil {
					if bytes, err := base64.StdEncoding.DecodeString(data); err == nil {
						fmt.Println("Cache hit", cacheKey, id)
						return c.Blob(http.StatusOK, "image/jpeg", bytes)
					}
				}
			}

			genHtml, err := rendering.ExtractHTML(fmt.Sprintf("http://127.0.0.1:7123/#!/extern-print/generator/%s/%s", id, base64.StdEncoding.EncodeToString([]byte("{}"))), "#render-done")
			if err != nil {
				return err
			}
			html = genHtml
		} else {
			return c.NoContent(http.StatusNotFound)
		}

		settings, err := db.GetSettings()
		if err != nil {
			return err
		}

		if settings.PrinterWidth < 50 {
			return log.ErrorString("print width is too low", log.WithValue("width", settings.PrinterWidth))
		}

		finalHtml, err := fixHtml(html, settings)
		if err != nil {
			return err
		}

		tempId := fmt.Sprint(rand.Int63())
		renderCache.SetDefault(tempId, finalHtml)

		img, err := rendering.RenderURL(fmt.Sprintf("http://127.0.0.1:7123/api/html/%s", tempId), settings.PrinterWidth)
		if err != nil {
			return err
		}

		buf, err := convertTo1BitPNG(img)
		if err != nil {
			return err
		}

		if len(cacheKey) > 0 {
			db.SetKey(cacheKey, base64.StdEncoding.EncodeToString(buf))
		}

		return c.Blob(http.StatusOK, "image/jpeg", buf)
	})
}
