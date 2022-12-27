// Package log provides logging utilities for S&D and makes it possible to hook into
// the logging to save the logs somewhere else.
package log

import (
	"errors"
	"fmt"
	"io"
	"os"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/jwalton/go-supportscolor"

	"github.com/fatih/color"
)

type Level string

const (
	LevelError = Level("ERROR")
	LevelInfo  = Level("INFO")
)

// Entry represents a single log entry.
type Entry struct {
	Level  Level     `json:"level"`
	Time   time.Time `json:"time"`
	Text   string    `json:"text"`
	Caller string    `json:"caller"`
	Values []Value   `json:"values"`
}

// Value represents a key, value pair containing
// contextual information for logging.
type Value struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

var hooks []func(e Entry)
var output io.Writer
var mtx sync.Mutex

func init() {
	output = os.Stdout

	if !supportscolor.Stdout().SupportsColor {
		color.NoColor = true
	}
}

func printToStd(e Entry) {
	mtx.Lock()
	defer mtx.Unlock()

	col := color.New(color.FgWhite)
	switch e.Level {
	case LevelInfo:
		col = color.New(color.FgBlue)
	case LevelError:
		col = color.New(color.FgRed)
	}

	// Check for multiline log output.
	if strings.Count(e.Text, "\n") > 0 {
		_, _ = fmt.Fprintf(output, "%s [ %-35s ] [%s]", col.Sprintf("%-6s", e.Level), e.Caller, e.Time.Format(time.RFC1123Z))

		for i := range e.Values {
			_, _ = fmt.Fprintf(output, " %s=%s", col.Sprint(e.Values[i].Name), e.Values[i].Value)
		}

		_, _ = output.Write([]byte{'\n'})

		lines := strings.Split(e.Text, "\n")
		for i := range lines {
			_, _ = fmt.Fprintf(output, "%s %v\n", col.Sprintf("%-6s", "|"), lines[i])
		}
	} else {
		_, _ = fmt.Fprintf(output, "%s [ %-35s ] [%s] %-50v", col.Sprintf("%-6s", e.Level), e.Caller, e.Time.Format(time.RFC1123Z), e.Text)
		for i := range e.Values {
			_, _ = fmt.Fprintf(output, " %s=%s", col.Sprint(e.Values[i].Name), e.Values[i].Value)
		}
		_, _ = output.Write([]byte{'\n'})
	}

	for i := range hooks {
		hooks[i](e)
	}
}

func getCaller(offset int) string {
	_, file, line, ok := runtime.Caller(2 + offset)
	if ok {
		packageIndex := strings.Index(file, "snd/")
		if packageIndex >= 0 {
			return fmt.Sprintf("%d:%s", line, file[packageIndex:])
		}
	}
	return "???"
}

// SetOutput changes the stream that the log's will
// be written to.
func SetOutput(writer io.Writer) {
	mtx.Lock()
	defer mtx.Unlock()

	output = writer
}

// AddHook adds a hook that will be called with each
// log entry that gets created.
func AddHook(fn func(e Entry)) {
	mtx.Lock()
	defer mtx.Unlock()

	hooks = append(hooks, fn)
}

// WithValue creates a named value that can be used
// to give a log contextual information.
func WithValue(name string, value interface{}) Value {
	return Value{
		Name:  name,
		Value: fmt.Sprint(value),
	}
}

// Error logs the error with the given values and
// returns err as it was passed.
func Error(err error, values ...Value) error {
	return ErrorUser(err, "", values...)
}

// ErrorString logs the error with the given values and
// returns a new err with string as it's content.
func ErrorString(err string, values ...Value) error {
	return ErrorUser(errors.New(err), "", values...)
}

// ErrorUser logs the error with the given values and
// returns err as it is was passed if len(userError) == 0
// or a new error with userError as content. This is
// useful if you want to return a more user-friendly error
// to the user while logging the original error in background.
func ErrorUser(err error, userError string, values ...Value) error {
	// Skip if no error is supplied.
	if err == nil {
		return nil
	}

	e := Entry{
		Level:  LevelError,
		Time:   time.Now(),
		Text:   err.Error(),
		Caller: getCaller(1),
		Values: values,
	}

	printToStd(e)

	if len(userError) > 0 {
		return errors.New(userError)
	}
	return err
}

// Info logs a information with the given values.
func Info(text string, values ...Value) {
	e := Entry{
		Level:  LevelInfo,
		Time:   time.Now(),
		Text:   text,
		Caller: getCaller(0),
		Values: values,
	}

	printToStd(e)
}
