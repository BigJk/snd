// Package server represents the webserver that powers S&D.
package server

import (
	"errors"
	"fmt"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4/middleware"
	"github.com/patrickmn/go-cache"
	"gopkg.in/olahol/melody.v1"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rpc"

	"github.com/labstack/echo/v4"
)

// To fix issue on Windows with reporting .js files as text/plain
// we force the content type for .js to 'application/javascript'.
//
// https://github.com/labstack/echo/issues/1038
func init() {
	_ = mime.AddExtensionType(".js", "application/javascript")

	http.DefaultClient.Timeout = time.Second * 2
}

type proxyCacheEntry struct {
	ContentType string
	Data        []byte
}

// Option represent an configuration option for the server.
type Option func(s *Server) error

// Server represents an instance of the S&D server.
type Server struct {
	sync.RWMutex
	debug         bool
	db            database.Database
	e             *echo.Echo
	m             *melody.Melody
	cache         *cache.Cache
	printers      printing.PossiblePrinter
	additionalRpc map[string]interface{}
}

// New creates a new instance of the S&D server.
func New(db database.Database, options ...Option) (*Server, error) {
	s := &Server{
		db:            db,
		e:             echo.New(),
		m:             melody.New(),
		cache:         cache.New(time.Minute*10, time.Minute),
		printers:      map[string]printing.Printer{},
		additionalRpc: map[string]interface{}{},
	}

	for i := range options {
		if err := options[i](s); err != nil {
			return nil, err
		}
	}

	return s, nil
}

// WithDebug sets the debug state of the Server.
func WithDebug(value bool) Option {
	return func(s *Server) error {
		s.debug = value
		return nil
	}
}

// WithPrinter registers a printer in the Server.
func WithPrinter(printer printing.Printer) Option {
	return func(s *Server) error {
		s.printers[printer.Name()] = printer
		return nil
	}
}

// WithAdditionalRPC adds an RPC function to the Server.
func WithAdditionalRPC(fnName string, fn interface{}) Option {
	return func(s *Server) error {
		s.additionalRpc[fnName] = fn
		return nil
	}
}

// Start starts the server with the given bind address.
//
// Examples:
// - ":7232" will accept all connections on port 7232
// - "127.0.0.1:7232" will only accept local connections on port 7232
func (s *Server) Start(bind string) error {
	// Create default settings if not existing
	if _, err := s.db.GetSettings(); err != nil {
		if err := s.db.SaveSettings(snd.Settings{
			PrinterWidth:          384,
			PrinterType:           "Preview Printing",
			PrinterEndpoint:       "window",
			Stylesheets:           []string{},
			SpellcheckerLanguages: []string{"en-US"},
		}); err != nil {
			return err
		}
	}

	// Register rpc routes
	api := s.e.Group("/api")
	extern := api.Group("/extern")

	rpc.RegisterVersion(api)
	rpc.RegisterImageUtilities(api)
	rpc.RegisterSettings(api, s.db)
	rpc.RegisterTemplate(api, extern, s.db)
	rpc.RegisterGenerator(api, extern, s.db)
	rpc.RegisterEntry(api, s.db)
	rpc.RegisterSources(api, s.db)
	rpc.RegisterPrint(api, extern, s.db, s.printers)
	rpc.RegisterSync(api, s.m, s.db)
	rpc.RegisterGit(api, s.db)
	rpc.RegisterCloud(api, s.db)

	// Register additional routes
	for k, v := range s.additionalRpc {
		api.POST(fmt.Sprintf("/%s", k), echo.WrapHandler(nra.MustBind(v)))
	}

	// Makes it possible to check in frontend if an
	// additional function has been registered.
	api.POST("/hasExt", echo.WrapHandler(nra.MustBind(func(name string) error {
		if _, ok := s.additionalRpc[name]; ok {
			return nil
		}
		return errors.New("function not available")
	})))

	// Register proxy route so that the iframes that are used
	// in the frontend can proxy images and other data that they
	// otherwise couldn't access because of CORB
	s.e.GET("/proxy/*", func(c echo.Context) error {
		reqUrl := c.Request().RequestURI[len("/index/"):]
		if !strings.HasPrefix(reqUrl, "http") {
			return c.NoContent(http.StatusBadRequest)
		}

		hit, ok := s.cache.Get(reqUrl)
		if ok {
			log.Info("proxy url from cache", log.WithValue("url", reqUrl))

			entry := hit.(*proxyCacheEntry)
			return c.Blob(http.StatusOK, entry.ContentType, entry.Data)
		}

		log.Info("proxy url", log.WithValue("url", reqUrl))

		resp, err := http.Get(reqUrl)
		if err != nil {
			return c.NoContent(http.StatusBadRequest)
		}
		defer resp.Body.Close()

		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return c.NoContent(http.StatusBadRequest)
		}

		if resp.StatusCode == http.StatusOK {
			s.cache.SetDefault(reqUrl, &proxyCacheEntry{
				ContentType: resp.Header.Get("Content-Type"),
				Data:        data,
			})
		}

		return c.Blob(resp.StatusCode, resp.Header.Get("Content-Type"), data)
	})

	// Same as proxy route but without caching. Can be used for
	// dynamic API requests.
	s.e.GET("/fetch/*", func(c echo.Context) error {
		reqUrl := c.Request().RequestURI[len("/fetch/"):]
		if !strings.HasPrefix(reqUrl, "http") {
			return c.NoContent(http.StatusBadRequest)
		}

		log.Info("proxy url fetch", log.WithValue("url", reqUrl))

		resp, err := http.Get(reqUrl)
		if err != nil {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
		defer resp.Body.Close()

		data, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return c.JSON(http.StatusBadRequest, err.Error())
		}

		return c.Blob(resp.StatusCode, resp.Header.Get("Content-Type"), data)
	})

	api.GET("/ws", func(c echo.Context) error {
		return s.m.HandleRequest(c.Response().Writer, c.Request())
	})

	// Make frontend and static directory public
	if s.debug { // If debug is enabled pass frontend requests to vite dev server.
		viteUrl, err := url.Parse("http://127.0.0.1:3000")
		if err != nil {
			return err
		}

		s.e.Use(middleware.ProxyWithConfig(middleware.ProxyConfig{Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/api") ||
				strings.HasPrefix(c.Request().URL.Path, "/proxy") ||
				strings.HasPrefix(c.Request().URL.Path, "/fetch") ||
				strings.HasPrefix(c.Request().URL.Path, "/static")
		}, Balancer: middleware.NewRoundRobinBalancer([]*middleware.ProxyTarget{{URL: viteUrl}})}))
	} else {
		s.e.Static("/", "./frontend/dist")
	}
	s.e.Static("/static", "./static")
	s.e.Use(middleware.CORS())

	s.e.HideBanner = true
	s.e.HidePort = true

	// Save all logs
	log.AddHook(func(e log.Entry) {
		_ = s.db.AddLog(e)
	})

	log.Info("Server started", log.WithValue("bind", bind))

	return s.e.Start(bind)
}
