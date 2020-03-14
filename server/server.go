package server

import (
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd"
	"github.com/BigJk/snd/log"
	"github.com/BigJk/snd/printing"
	"github.com/BigJk/snd/rpc"

	"github.com/asdine/storm"
	"github.com/labstack/echo"
)

// ServerOption
type Option func(s *Server) error

// Server represents a instance of the S&D server.
type Server struct {
	sync.RWMutex
	db            *storm.DB
	e             *echo.Echo
	scriptEngine  *snd.ScriptEngine
	printers      printing.PossiblePrinter
	additionalRpc map[string]interface{}
}

// NewServer creates a new instance of the S&D server.
func NewServer(file string, options ...Option) (*Server, error) {
	db, err := storm.Open(file)
	if err != nil {
		return nil, err
	}

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
	var settings snd.Settings
	if err := s.db.Get("base", "settings", &settings); err == storm.ErrNotFound {
		if err := s.db.Set("base", "settings", &snd.Settings{
			PrinterWidth:    384,
			PrinterEndpoint: "http://127.0.0.1:3000",
			Stylesheets:     []string{},
		}); err != nil {
			return err
		}
	}

	// Create script engine
	s.scriptEngine = snd.NewScriptEngine(snd.AttachScriptRuntime(s.db))

	// Register rpc routes
	api := s.e.Group("/api")
	rpc.RegisterBasic(api, s.db)
	rpc.RegisterTemplate(api, s.db)
	rpc.RegisterEntry(api, s.db)
	rpc.RegisterPrint(api, s.db, s.printers)
	rpc.RegisterScript(api, s.db, s.scriptEngine)

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
	s.e.GET("/image-proxy", func(c echo.Context) error {
		resp, err := http.Get(c.QueryParam("url"))
		if err != nil {
			return c.NoContent(http.StatusBadRequest)
		}

		return c.Stream(resp.StatusCode, resp.Header.Get("Content-Type"), resp.Body)
	})

	// Make frontend and static directory public
	s.e.Static("/", "./frontend/dist")
	s.e.Static("/static", "./static")

	s.e.HideBanner = true
	s.e.HidePort = true

	fmt.Println(`
   _____        _____  
  / ____| ___  |  __ \ 
 | (___  ( _ ) | |  | |
  \___ \ / _ \/\ |  | |
  ____) | (_>  < |__| |
 |_____/ \___/\/_____/ 
________________________________________`)
	if len(snd.GitCommitHash) > 0 {
		fmt.Println("Build Time    :", snd.BuildTime)
		fmt.Println("Commit Branch :", snd.GitBranch)
		fmt.Println("Commit Hash   :", snd.GitCommitHash)
	}

	// Save all logs
	log.AddHook(func(e log.Entry) {
		_ = s.db.Set("logs", e.Time.Format(time.RFC3339), &e)
	})

	log.Info("Server started", log.WithValue("bind", bind))

	return s.e.Start(bind)
}
