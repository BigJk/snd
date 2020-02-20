package snd

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"strings"

	"github.com/BigJk/snd/rendering"
	"github.com/BigJk/snd/thermalprinter/epson"

	"github.com/asdine/storm/q"

	"github.com/PuerkitoBio/goquery"

	"github.com/BigJk/nra"
	"github.com/asdine/storm"
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

// RegisterRPC register the rpc routes for the frontend.
func RegisterRPC(route *echo.Group, db *storm.DB, scriptEngine *ScriptEngine, printer ServerPossiblePrinter) {
	/*
		Version
	*/
	route.POST("/getVersion", echo.WrapHandler(nra.MustBind(func() (interface{}, error) {
		return struct {
			BuildTime     string `json:"build_time"`
			GitCommitHash string `json:"git_commit_hash"`
			GitBranch     string `json:"git_branch"`
		}{
			BuildTime:     BuildTime,
			GitCommitHash: GitCommitHash,
			GitBranch:     GitBranch,
		}, nil
	})))

	/*
		Settings
	*/
	route.POST("/getSettings", echo.WrapHandler(nra.MustBind(func() (*Settings, error) {
		var settings Settings
		if err := db.Get("base", "settings", &settings); err != nil {
			return nil, err
		}

		return &settings, nil
	})))

	route.POST("/saveSettings", echo.WrapHandler(nra.MustBind(func(s Settings) error {
		return db.Set("base", "settings", &s)
	})))

	/*
		Templates
	*/
	route.POST("/saveTemplate", echo.WrapHandler(nra.MustBind(func(t Template) error {
		return db.Save(&t)
	})))

	route.POST("/deleteTemplate", echo.WrapHandler(nra.MustBind(func(id int) error {
		return db.DeleteStruct(&Template{ID: id})
	})))

	route.POST("/getTemplates", echo.WrapHandler(nra.MustBind(func() ([]Template, error) {
		var templates []Template
		if err := db.All(&templates); err != nil && err != storm.ErrNotFound {
			return nil, err
		}

		return templates, nil
	})))

	/*
		Entries
	*/
	route.POST("/getEntries", echo.WrapHandler(nra.MustBind(func(id int, page int, search string) ([]Entry, error) {
		var entries []Entry

		if len(search) == 0 {
			if err := db.From(fmt.Sprint(id)).Select().Skip(page * 50).Limit(50).Find(&entries); err != nil && err != storm.ErrNotFound {
				return nil, err
			}
		} else {
			if err := db.From(fmt.Sprint(id)).Select(q.Re("Data", "(?i)"+search)).Skip(page * 50).Limit(50).Find(&entries); err != nil && err != storm.ErrNotFound {
				return nil, err
			}
		}

		return entries, nil
	})))

	route.POST("/getEntriesPages", echo.WrapHandler(nra.MustBind(func(id int, search string) (int, error) {
		var c int
		var err error

		if len(search) == 0 {
			if c, err = db.From(fmt.Sprint(id)).Select().Count(&Entry{}); err != nil && err != storm.ErrNotFound {
				return 0, err
			}
		} else {
			if c, err = db.From(fmt.Sprint(id)).Select(q.Re("Data", "(?i)"+search)).Count(&Entry{}); err != nil && err != storm.ErrNotFound {
				return 0, err
			}
		}

		return (c / 50) + 1, nil
	})))

	route.POST("/saveEntry", echo.WrapHandler(nra.MustBind(func(id int, e Entry) error {
		return db.From(fmt.Sprint(id)).Save(&e)
	})))

	route.POST("/deleteEntry", echo.WrapHandler(nra.MustBind(func(id int, eid int) error {
		return db.From(fmt.Sprint(id)).DeleteStruct(&Entry{ID: eid})
	})))

	route.POST("/getEntry", echo.WrapHandler(nra.MustBind(func(id int, eid int) (*Entry, error) {
		var entry Entry
		if err := db.From(fmt.Sprint(id)).One("ID", eid, &entry); err != nil {
			return nil, err
		}

		return &entry, nil
	})))

	/*
		Printing
	*/
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
		var settings Settings
		if err := db.Get("base", "settings", &settings); err != nil {
			return err
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
			}

			var image ImageCache
			if err := db.Get("images", url, &image); err == nil {
				s.SetAttr("src", "data:"+image.ContentType+";base64,"+image.Base)
			} else {
				resp, err := http.Get(url)
				if err != nil || resp.StatusCode != http.StatusOK {
					s.SetAttr("src", url)
					return
				}

				data, err := ioutil.ReadAll(resp.Body)
				if err != nil {
					s.SetAttr("src", url)
					return
				}

				image.ContentType = resp.Header.Get("Content-Type")
				image.Base = base64.StdEncoding.EncodeToString(data)

				_ = db.Set("images", url, &image)
				_ = resp.Body.Close()

				s.SetAttr("src", "data:"+image.ContentType+";base64,"+image.Base)
			}
		})

		finalHtml, err := doc.Html()
		if err != nil {
			return err
		}

		// Render the html to image
		image, err := rendering.RenderHTML(finalHtml)
		if err != nil {
			return err
		}

		// Print
		buf := &bytes.Buffer{}
		epson.Image(buf, image)
		buf.WriteString("\n\n\n\n\n\n")

		return printer.Print(settings.PrinterEndpoint, buf.Bytes())
	})))

	/*
		Scripts
	*/
	route.POST("/saveScript", echo.WrapHandler(nra.MustBind(func(s Script) error {
		return db.Save(&s)
	})))

	route.POST("/deleteScript", echo.WrapHandler(nra.MustBind(func(id int) error {
		return db.DeleteStruct(&Script{ID: id})
	})))

	route.POST("/getScripts", echo.WrapHandler(nra.MustBind(func() ([]Script, error) {
		var scripts []Script
		if err := db.All(&scripts); err != nil && err != storm.ErrNotFound {
			return nil, err
		}

		return scripts, nil
	})))

	route.POST("/runScript", echo.WrapHandler(nra.MustBind(func(id int) error {
		var script Script

		if err := db.One("ID", id, &script); err != nil {
			return err
		}

		return scriptEngine.Exec(&script)
	})))

	route.POST("/verifyScript", echo.WrapHandler(nra.MustBind(func(script string) ([]ScriptError, error) {
		return scriptEngine.Verify(script), nil
	})))
}
