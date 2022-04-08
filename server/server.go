package server

import (
	"errors"
	"fmt"
	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/middleware"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rpc"

	"github.com/labstack/echo"
)

// ServerOption
type Option func(s *Server) error

// Server represents a instance of the S&D server.
type Server struct {
	sync.RWMutex
	debug         bool
	db            database.Database
	e             *echo.Echo
	printers      printing.PossiblePrinter
	additionalRpc map[string]interface{}
}

// New creates a new instance of the S&D server.
func New(db database.Database, options ...Option) (*Server, error) {
	s := &Server{
		db:            db,
		e:             echo.New(),
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

func WithDebug(value bool) Option {
	return func(s *Server) error {
		s.debug = value
		return nil
	}
}

func WithPrinter(printer printing.Printer) Option {
	return func(s *Server) error {
		s.printers[printer.Name()] = printer
		return nil
	}
}

func WithAdditionalRPC(fnName string, fn interface{}) Option {
	return func(s *Server) error {
		s.additionalRpc[fnName] = fn
		return nil
	}
}

func (s *Server) Start(bind string) error {
	// Create default settings if not existing
	if _, err := s.db.GetSettings(); err != nil {
		if err := s.db.SaveSettings(snd.Settings{
			PrinterWidth:    384,
			PrinterEndpoint: "http://127.0.0.1:3000",
			Stylesheets:     []string{},
		}); err != nil {
			return err
		}
	}

	// Create script engine
	// TODO: scripting

	// Register rpc routes
	api := s.e.Group("/api")
	rpc.RegisterBasic(api, s.db)
	rpc.RegisterTemplate(api, s.db)
	rpc.RegisterEntry(api, s.db)
	rpc.RegisterSources(api, s.db)
	rpc.RegisterPrint(api, s.db, s.printers)
	rpc.RegisterScript(api, s.db)

	// Register additional routes
	for k, v := range s.additionalRpc {
		api.POST(fmt.Sprintf("/%s", k), echo.WrapHandler(nra.MustBind(v)))
	}

	// Makes it possible to check in frontend if a
	// additional function has been registered.
	api.POST("/hasExt", echo.WrapHandler(nra.MustBind(func(name string) error {
		if _, ok := s.additionalRpc[name]; ok {
			return nil
		}
		return errors.New("function not available")
	})))

	// Register image proxy route so that the iframes that are used
	// in the frontend can proxy images that they otherwise couldn't
	// access because of CORB
	s.e.GET("/proxy", func(c echo.Context) error {
		log.Info("proxy url", log.WithValue("url", c.QueryParam("url")))

		resp, err := http.Get(c.QueryParam("url"))
		if err != nil {
			return c.NoContent(http.StatusBadRequest)
		}

		return c.Stream(resp.StatusCode, resp.Header.Get("Content-Type"), resp.Body)
	})

	// Make frontend and static directory public
	if s.debug {
		viteUrl, err := url.Parse("http://127.0.0.1:3000")
		if err != nil {
			return err
		}

		s.e.Use(middleware.ProxyWithConfig(middleware.ProxyConfig{Skipper: func(c echo.Context) bool {
			return strings.HasPrefix(c.Request().URL.Path, "/api") || strings.HasPrefix(c.Request().URL.Path, "/proxy")
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
