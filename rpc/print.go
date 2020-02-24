package rpc

import (
	"bytes"
	"net"
	"strings"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rendering"
	"github.com/BigJk/snd/thermalprinter/epson"
	"github.com/PuerkitoBio/goquery"
	"github.com/asdine/storm"
	"github.com/labstack/echo"
	"github.com/pkg/errors"
)

// GetOutboundIP gets the local ip.
func GetOutboundIP() (net.IP, error) {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return nil, err
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	return localAddr.IP, nil
}

func RegisterPrint(route *echo.Group, db *storm.DB, printer printing.PossiblePrinter) {
	route.POST("/getPrinter", echo.WrapHandler(nra.MustBind(func() (map[string]string, error) {
		printerNames := map[string]string{}

		for k, v := range printer {
			printerNames[k] = v.Description()
		}

		return printerNames, nil
	})))

	route.POST("/print", echo.WrapHandler(nra.MustBind(func(html string) error {
		// Get local outbound ip
		ip, err := GetOutboundIP()
		if err != nil {
			return err
		}

		// Get current settings
		var settings snd.Settings
		if err := db.Get("base", "settings", &settings); err != nil {
			return err
		}

		if settings.PrinterWidth < 50 {
			return errors.New("print width is too low")
		}

		// Get printer
		printer, ok := printer[settings.PrinterType]
		if !ok {
			return errors.New("printer not found")
		}

		// Generate html
		htmlHead := `<!DOCTYPE html>
<html lang="en">
  <title>print page</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">`

		for i := range settings.Stylesheets {
			url := settings.Stylesheets[i]
			if strings.HasPrefix(url, "/") {
				url = "http://" + ip.String() + ":7123" + url
			}
			htmlHead += `<link rel="stylesheet" href="` + settings.Stylesheets[i] + `">` + "\n"
		}

		htmlHead += `<body class="sans-serif">
		<div id="content">`

		doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlHead + html + "</div></body></html>"))
		if err != nil {
			return err
		}

		doc.Find("img").Each(func(i int, s *goquery.Selection) {
			url := s.AttrOr("src", "")
			if strings.HasPrefix(url, "/") {
				url = "http://" + ip.String() + ":7123" + url
				s.SetAttr("src", url)
			}
		})

		finalHtml, err := doc.Html()
		if err != nil {
			return err
		}

		// Render the html to image
		image, err := rendering.RenderHTML(finalHtml, settings.PrinterWidth)
		if err != nil {
			return err
		}

		// Print
		buf := &bytes.Buffer{}

		if settings.Commands.ExplicitInit {
			epson.InitPrinter(buf)
		}

		if settings.Commands.ForceStandardMode {
			epson.SetStandardMode(buf)
		}

		buf.WriteString(strings.Repeat("\n", settings.Commands.LinesBefore))
		epson.Image(buf, image)
		buf.WriteString(strings.Repeat("\n", 5+settings.Commands.LinesAfter))

		if settings.Commands.Cut {
			epson.CutPaper(buf)
		}

		return printer.Print(settings.PrinterEndpoint, buf.Bytes())
	})))
}
