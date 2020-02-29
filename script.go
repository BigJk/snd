package snd

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/d5/tengo/v2"
	"github.com/d5/tengo/v2/parser"
)

// Script represents a tengo script.
type Script struct {
	ID          int    `json:"id" storm:"id,increment"`
	Name        string `json:"name" storm:"unique"`
	Description string `json:"description"`
	Source      string `json:"source"`
}

type ScriptError struct {
	Line   int    `json:"line"`
	Column int    `json:"column"`
	Error  string `json:"error"`
}

func toTengoError(err error) tengo.Object {
	return &tengo.Error{
		Value: &tengo.String{
			Value: err.Error(),
		},
	}
}

// ScriptContext represents the context of a running
// tengo script together with it's cancel function.
type ScriptContext struct {
	Context    context.Context
	CancelFunc context.CancelFunc
}

// ScriptAttachFunc is called before a script is executed
// and is used to register custom functions.
type ScriptAttachFunc func(script *tengo.Script)

// ScriptEngine keeps track of running scripts.
type ScriptEngine struct {
	sync.RWMutex
	execution map[int]ScriptContext
	attach    ScriptAttachFunc
}

// NewScriptEngine creates a new script engine with the given
// ScriptAttachFunc that will be called on each script that will
// be executed.
func NewScriptEngine(attach ScriptAttachFunc) *ScriptEngine {
	return &ScriptEngine{
		RWMutex:   sync.RWMutex{},
		execution: map[int]ScriptContext{},
		attach:    attach,
	}
}

// Exec tries to execute a script.
func (se *ScriptEngine) Exec(scr *Script) error {
	se.Lock()
	defer se.Unlock()

	if _, ok := se.execution[scr.ID]; ok {
		return errors.New("already running")
	}

	tscr := tengo.NewScript([]byte(scr.Source))
	if se.attach != nil {
		se.attach(tscr)
	}

	compiled, err := tscr.Compile()
	if err != nil {
		return errors.New(err.Error())
	}

	ctx, cancel := context.WithCancel(context.Background())
	se.execution[scr.ID] = ScriptContext{
		Context:    ctx,
		CancelFunc: cancel,
	}

	go func() {
		if err := compiled.RunContext(ctx); err != nil {
			fmt.Println("script", scr.Name, "finished with error: ", err)
		}

		se.Lock()
		delete(se.execution, scr.ID)
		se.Unlock()
	}()

	return nil
}

// Very tries to compile a script and returns the errors
// if something is wrong.
func (se *ScriptEngine) Verify(scr string) []ScriptError {
	tscr := tengo.NewScript([]byte(scr))
	_, err := tscr.Compile()
	if err == nil {
		return nil
	}

	if errLocation, ok := err.(*tengo.CompilerError); ok {
		return []ScriptError{
			{
				Line:  errLocation.FileSet.Base - 10,
				Error: errLocation.Err.Error(),
			},
		}
	}

	var errors []ScriptError
	if errList, ok := err.(parser.ErrorList); ok {
		lst := errList
		for i := range lst {
			errors = append(errors, ScriptError{
				Line:   lst[i].Pos.Line,
				Column: lst[i].Pos.Column,
				Error:  lst[i].Msg,
			})
		}
	}
	return errors
}
