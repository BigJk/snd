package snd

import (
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/BigJk/snd/log"
	"github.com/d5/tengo/v2"
	"github.com/d5/tengo/v2/stdlib"

	"github.com/asdine/storm"
)

func getPrintArgs(args []tengo.Object) ([]interface{}, error) {
	var printArgs []interface{}
	l := 0
	for _, arg := range args {
		s, _ := tengo.ToString(arg)
		slen := len(s)
		if l+slen > tengo.MaxStringLen {
			return nil, tengo.ErrStringLimit
		}
		l += slen
		printArgs = append(printArgs, s)
	}
	return printArgs, nil
}

// AttachScriptRuntime registers the custom tengo functions to a script.
func AttachScriptRuntime(db *storm.DB) ScriptAttachFunc {
	return func(script *tengo.Script, name string) {
		script.Add("Log", &tengo.UserFunction{
			Name: "Log",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				printArgs, err := getPrintArgs(args)
				if err != nil {
					return nil, err
				}

				log.Info(fmt.Sprint(printArgs...), log.WithValue("script", name))
				return tengo.UndefinedValue, nil
			},
		})

		script.Add("Error", &tengo.UserFunction{
			Name: "Error",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				printArgs, err := getPrintArgs(args)
				if err != nil {
					return nil, err
				}

				_ = log.ErrorString(fmt.Sprint(printArgs...), log.WithValue("script", name))
				return tengo.UndefinedValue, nil
			},
		})

		script.Add("CreateTemplateIfNotExist", &tengo.UserFunction{
			Name: "CreateTemplateIfNotExist",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				if len(args) != 2 && len(args) != 3 {
					return nil, tengo.ErrWrongNumArguments
				}

				name, ok := tengo.ToString(args[0])
				if !ok {
					return toTengoError(errors.New("1. argument wasn't a string")), nil
				}

				foreignName, ok := tengo.ToString(args[1])
				if !ok {
					return toTengoError(errors.New("2. argument wasn't a string")), nil
				}

				if len(name) == 0 {
					return toTengoError(err), nil
				}

				var template Template
				if len(foreignName) > 0 {
					err = db.One("ForeignName", foreignName, &template)
				}
				template.Name = name
				template.ForeignName = foreignName

				if len(args) == 3 {
					description, ok := tengo.ToString(args[2])
					if !ok {
						return toTengoError(errors.New("3. argument wasn't a string")), nil
					}

					template.Description = description
				}

				err = db.Save(&template)
				if err != nil {
					return toTengoError(err), nil
				}

				return &tengo.Int{
					ObjectImpl: tengo.ObjectImpl{},
					Value:      int64(template.ID),
				}, nil
			},
		})

		script.Add("CreateEntryIfNotExist", &tengo.UserFunction{
			Name: "CreateEntryIfNotExist",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				if len(args) != 4 {
					return nil, tengo.ErrWrongNumArguments
				}

				templateId, ok := tengo.ToInt(args[0])
				if !ok {
					return toTengoError(errors.New("1. argument wasn't a int")), nil
				}

				name, ok := tengo.ToString(args[1])
				if !ok {
					return toTengoError(errors.New("2. argument wasn't a string")), nil
				}

				foreignId, ok := tengo.ToString(args[2])
				if !ok {
					return toTengoError(errors.New("3. argument wasn't a string")), nil
				}

				data, ok := tengo.ToString(args[3])
				if !ok {
					return toTengoError(errors.New("4. argument wasn't a string")), nil
				}

				if len(name) == 0 {
					return toTengoError(err), nil
				}

				dbNode := db.From(fmt.Sprint(templateId))

				var entry Entry
				if len(foreignId) > 0 {
					_ = dbNode.One("ForeignID", foreignId, &entry)
				}
				entry.Name = name
				entry.Data = data
				entry.ForeignID = foreignId

				if err = dbNode.Save(&entry); err != nil {
					return toTengoError(err), nil
				}

				return &tengo.Int{
					ObjectImpl: tengo.ObjectImpl{},
					Value:      int64(entry.ID),
				}, nil
			},
		})

		script.Add("SetSkeleton", &tengo.UserFunction{
			Name: "SetSkeleton",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				if len(args) != 2 {
					return nil, tengo.ErrWrongNumArguments
				}

				templateId, ok := tengo.ToInt(args[0])
				if !ok {
					return toTengoError(errors.New("1. argument wasn't a int")), nil
				}

				foreignId, ok := tengo.ToString(args[1])
				if !ok {
					return toTengoError(errors.New("2. argument wasn't a string")), nil
				}

				var template Template
				if err = db.One("ID", templateId, &template); err != nil {
					return toTengoError(err), nil
				}

				dbNode := db.From(fmt.Sprint(templateId))

				var entry Entry
				if err = dbNode.One("ForeignID", foreignId, &entry); err != nil {
					return toTengoError(err), nil
				}

				template.SkeletonData = entry.Data
				if err = db.Save(&template); err != nil {
					return toTengoError(err), nil
				}

				return nil, nil
			},
		})

		script.Add("SetSkeletonJSON", &tengo.UserFunction{
			Name: "SetSkeletonJSON",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				if len(args) != 2 {
					return nil, tengo.ErrWrongNumArguments
				}

				templateId, ok := tengo.ToInt(args[0])
				if !ok {
					return toTengoError(errors.New("1. argument wasn't a int")), nil
				}

				data, ok := tengo.ToString(args[1])
				if !ok {
					return toTengoError(errors.New("2. argument wasn't a string")), nil
				}

				var template Template
				if err = db.One("ID", templateId, &template); err != nil {
					return toTengoError(err), nil
				}

				template.SkeletonData = data
				if err = db.Save(&template); err != nil {
					return toTengoError(err), nil
				}

				return nil, nil
			},
		})

		script.Add("Get", &tengo.UserFunction{
			Name: "Get",
			Value: func(args ...tengo.Object) (ret tengo.Object, err error) {
				if len(args) != 1 {
					return nil, tengo.ErrWrongNumArguments
				}

				url, ok := tengo.ToString(args[0])
				if !ok {
					return toTengoError(errors.New("argument wasn't a string")), nil
				}

				resp, err := http.Get(url)
				if err != nil {
					return toTengoError(err), nil
				}

				defer resp.Body.Close()

				body, err := ioutil.ReadAll(resp.Body)
				if err != nil {
					return toTengoError(err), nil
				}

				return &tengo.String{
					ObjectImpl: tengo.ObjectImpl{},
					Value:      string(body),
				}, nil
			},
		})

		script.SetImports(stdlib.GetModuleMap(stdlib.AllModuleNames()...))
	}
}
