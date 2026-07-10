package tcp

import (
	"bytes"
	"io"
	"net"
	"testing"
)

func TestPrintWritesDataAndClosesConnection(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()

	want := []byte{0x1b, 0x40, 0x00, 0xff, 0x0a}
	gotCh := make(chan []byte, 1)
	errCh := make(chan error, 1)

	go func() {
		conn, err := listener.Accept()
		if err != nil {
			errCh <- err
			return
		}
		defer conn.Close()

		got, err := io.ReadAll(conn)
		if err != nil {
			errCh <- err
			return
		}
		gotCh <- got
	}()

	printer := &TCP{}
	if err := printer.Print(listener.Addr().String(), nil, want); err != nil {
		t.Fatal(err)
	}

	select {
	case err := <-errCh:
		t.Fatal(err)
	case got := <-gotCh:
		if !bytes.Equal(got, want) {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}

func TestPrintRequiresHostPortEndpoint(t *testing.T) {
	printer := &TCP{}
	if err := printer.Print("printer", nil, nil); err == nil {
		t.Fatal("expected endpoint syntax error")
	}
}
