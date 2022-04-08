package rpc

import (
	"bytes"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"image/png"
	"io/ioutil"
	"net"
	"strings"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rendering"
	"github.com/BigJk/snd/thermalprinter/epson"
	"github.com/PuerkitoBio/goquery"
	"github.com/labstack/echo"
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
		return "", log.ErrorUser(err, "html parsing failed")
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
		return "", log.ErrorUser(err, "html rendering failed")
	}

	finalHtml = strings.Replace(finalHtml, `url("/static/`, `url("http://`+ip.String()+`:7123/static/`, -1)
	finalHtml = strings.Replace(finalHtml, `url('/static/`, `url('http://`+ip.String()+`:7123/static/`, -1)
	finalHtml = strings.Replace(finalHtml, `url(/static/`, `url(http://`+ip.String()+`:7123/static/`, -1)
	finalHtml = strings.Replace(finalHtml, `url("static/`, `url("http://`+ip.String()+`:7123/static/`, -1)
	finalHtml = strings.Replace(finalHtml, `url('static/`, `url('http://`+ip.String()+`:7123/static/`, -1)
	finalHtml = strings.Replace(finalHtml, `url(static/`, `url(http://`+ip.String()+`:7123/static/`, -1)

	finalHtml = strings.Replace(finalHtml, `url("/proxy?url=`, `url("http://`+ip.String()+`:7123/proxy?url=`, -1)
	finalHtml = strings.Replace(finalHtml, `url('/proxy?url=`, `url('http://`+ip.String()+`:7123/proxy?url=`, -1)
	finalHtml = strings.Replace(finalHtml, `url(/proxy?url=`, `url(http://`+ip.String()+`:7123/proxy?url=`, -1)
	finalHtml = strings.Replace(finalHtml, `url("proxy?url=`, `url("http://`+ip.String()+`:7123/proxy?url=`, -1)
	finalHtml = strings.Replace(finalHtml, `url('proxy?url=`, `url('http://`+ip.String()+`:7123/proxy?url=`, -1)
	finalHtml = strings.Replace(finalHtml, `url(proxy?url=`, `url(http://`+ip.String()+`:7123/proxy?url=`, -1)

	return finalHtml, nil
}

func RegisterPrint(route *echo.Group, db database.Database, printer printing.PossiblePrinter) {
	route.POST("/getPrinter", echo.WrapHandler(nra.MustBind(func() (map[string]string, error) {
		printerNames := map[string]string{}

		for k, v := range printer {
			printerNames[k] = v.Description()
		}

		return printerNames, nil
	})))

	route.POST("/getAvailablePrinter", echo.WrapHandler(nra.MustBind(func() (map[string]map[string]string, error) {
		available := map[string]map[string]string{}

		for k, v := range printer {
			a, err := v.AvailableEndpoints()
			if err != nil {
				_ = log.Error(err, log.WithValue("printer", k))
			}
			available[k] = a
		}

		return available, nil
	})))

	route.POST("/print", echo.WrapHandler(nra.MustBind(func(html string) error {
		// Get current settings
		settings, err := db.GetSettings()
		if err != nil {
			return err
		}

		if settings.PrinterWidth < 50 {
			return log.ErrorString("print width is too low", log.WithValue("width", settings.PrinterWidth))
		}

		// Get printer
		printer, ok := printer[settings.PrinterType]
		if !ok {
			return log.ErrorString("print not found", log.WithValue("printer", settings.PrinterType))
		}

		finalHtml, err := fixHtml(html, settings)
		if err != nil {
			return err
		}

		// Render the html to image
		image, err := rendering.RenderHTML(finalHtml, settings.PrinterWidth)
		if err != nil {
			return log.ErrorUser(err, "html to image rendering failed")
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

		err = printer.Print(settings.PrinterEndpoint, image, buf.Bytes())
		if err != nil {
			return log.ErrorUser(err, "printer wasn't able to print", log.WithValue("printer", settings.PrinterType), log.WithValue("endpoint", settings.PrinterEndpoint))
		}

		return nil
	})))

	route.POST("/screenshot", echo.WrapHandler(nra.MustBind(func(html string, file string) error {
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

		img, err := rendering.RenderHTML(finalHtml, settings.PrinterWidth)
		if err != nil {
			return err
		}

		buf := &bytes.Buffer{}
		if err := png.Encode(buf, img); err != nil {
			return err
		}

		return ioutil.WriteFile(file, buf.Bytes(), 0666)
	})))
}
