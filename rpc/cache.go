package rpc

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/patrickmn/go-cache"
	"io"
	"net"
	"net/http"
	"time"
)

var rpcCache = cache.New(time.Second*30, time.Minute)

type hijackedResponseWriter struct {
	writer     io.Writer
	resp       http.ResponseWriter
	statusCode int
}

func (resp *hijackedResponseWriter) Header() http.Header {
	return resp.resp.Header()
}

func (resp *hijackedResponseWriter) WriteHeader(code int) {
	resp.statusCode = code
	resp.resp.WriteHeader(code)
}

func (resp *hijackedResponseWriter) Write(b []byte) (int, error) {
	return resp.writer.Write(b)
}

func (resp *hijackedResponseWriter) Flush() {
	resp.resp.(http.Flusher).Flush()
}

func (resp *hijackedResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	return resp.resp.(http.Hijacker).Hijack()
}

func cacheRpcFunction(expirationTime time.Duration) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if c.Request().Method != http.MethodPost {
				return next(c)
			}

			req, err := io.ReadAll(c.Request().Body)
			if err != nil {
				return c.NoContent(http.StatusBadRequest)
			}
			c.Request().Body = io.NopCloser(bytes.NewBuffer(req))

			reqHash := fmt.Sprintf("%X", sha256.Sum256(req))

			// Check if the request is already cached and cache-control is not set to no-store.
			if c.Request().Header.Get("Cache-Control") != "no-store" {
				if val, ok := rpcCache.Get(reqHash); ok {
					return c.JSONBlob(http.StatusOK, val.([]byte))
				}
			}

			// Create new buffer and hijack response writer to capture the response.
			buf := &bytes.Buffer{}
			oldWriter := c.Response().Writer
			hijacked := &hijackedResponseWriter{
				writer:     io.MultiWriter(oldWriter, buf),
				resp:       oldWriter,
				statusCode: 0,
			}
			c.Response().Writer = hijacked

			// Call next handler
			err = next(c)

			if hijacked.statusCode == http.StatusOK {
				rpcCache.Set(reqHash, buf.Bytes(), expirationTime)
			}

			return err
		}
	}
}
