package rpc

import (
	"fmt"
	"net"

	"github.com/BigJk/snd/rpc/bind"
	"github.com/labstack/echo/v4"
)

func RegisterMisc(route *echo.Group) {
	bind.MustBind(route, "/getLocalURL", func(path string) (string, error) {
		conn, err := net.Dial("udp", "8.8.8.8:80")
		if err != nil {
			return fmt.Sprintf("http://127.0.0.1:7123%s", path), nil
		}
		defer conn.Close()
		localAddr := conn.LocalAddr().(*net.UDPAddr)
		return fmt.Sprintf("http://%s:7123%s", localAddr.IP.String(), path), nil
	})
}
