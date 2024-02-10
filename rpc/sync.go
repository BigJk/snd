package rpc

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BigJk/snd/rpc/bind"
	"path/filepath"
	"sync"
	"time"

	"github.com/BigJk/snd"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/imexport"
	"github.com/BigJk/snd/log"
	"github.com/fsnotify/fsnotify"
	"github.com/labstack/echo/v4"
	"gopkg.in/olahol/melody.v1"
)

func RegisterSync(route *echo.Group, m *melody.Melody, db database.Database) {
	type wsEvent struct {
		Type     string      `json:"type"`
		Data     interface{} `json:"data"`
		ClientID string      `json:"clientId"`
	}

	type syncSession struct {
		lastPing time.Time
		folder   string
		watcher  *fsnotify.Watcher
		close    chan struct{}
		wg       sync.WaitGroup
	}

	sessionsMtx := sync.Mutex{}
	sessions := map[string]*syncSession{}

	// close all synchronisation after 30 seconds
	go func() {
		ticker := time.NewTicker(time.Second * 30)
		for {
			select {
			case <-ticker.C:
				sessionsMtx.Lock()
				for _, v := range sessions {
					if time.Now().Sub(v.lastPing).Seconds() > 30 {
						log.Info("closing sync", log.WithValue("folder", v.folder))

						v.close <- struct{}{}
					}
				}
				sessionsMtx.Unlock()
			}
		}
	}()

	bind.MustBind(route, "/syncActive", func(id string) (bool, error) {
		sessionsMtx.Lock()
		defer sessionsMtx.Unlock()

		_, ok := sessions[id]
		return ok, nil
	})

	syncTemplate := func(id string, folder string) (string, error) {
		// export template
		tmpl, err := db.GetTemplate(id)
		if err != nil {
			return "", err
		}

		tmplFolder, err := imexport.ExportTemplateFolder(tmpl, nil, folder)
		if err != nil {
			return "", err
		}

		// create file watcher
		watcher, err := fsnotify.NewWatcher()
		if err != nil {
			return "", err
		}
		if err := watcher.Add(filepath.Join(folder, tmplFolder)); err != nil {
			return "", err
		}

		session := &syncSession{
			lastPing: time.Now(),
			folder:   filepath.Join(folder, tmplFolder),
			watcher:  watcher,
			close:    make(chan struct{}),
		}
		session.wg.Add(1)

		sessionsMtx.Lock()
		sessions[id] = session
		sessionsMtx.Unlock()

		go func() {
		watcher:
			for {
				select {
				case event, ok := <-watcher.Events:
					if !ok {
						return
					}
					if event.Op&fsnotify.Write == fsnotify.Write {
						updated, _, err := imexport.ImportTemplateFolder(session.folder)
						if err != nil {
							_ = log.ErrorString(fmt.Sprintf("error in '%s' watcher: %s", session.folder, err))
							continue
						}

						updated.Slug = tmpl.Slug
						updated.Author = tmpl.Author

						if err := db.SaveTemplate(updated); err != nil {
							_ = log.ErrorString(fmt.Sprintf("error while saving templatae in '%s' watcher: %s", session.folder, err))
						}

						data, _ := json.Marshal(wsEvent{
							Type: "TemplateUpdated/" + id,
							Data: nil,
						})

						_ = m.Broadcast(data)
					}
				case err, ok := <-watcher.Errors:
					if !ok {
						return
					}
					_ = log.ErrorString(fmt.Sprintf("error in '%s' watcher: %s", session.folder, err))
				case <-session.close:
					break watcher
				}
			}

			// remove session
			sessionsMtx.Lock()
			delete(sessions, id)
			sessionsMtx.Unlock()

			session.wg.Done()
		}()

		return filepath.Join(folder, tmplFolder), nil
	}

	syncGenerator := func(id string, folder string) (string, error) {
		// export generator
		gen, err := db.GetGenerator(id)
		if err != nil {
			return "", err
		}

		tmplFolder, err := imexport.ExportGeneratorFolder(gen, folder)
		if err != nil {
			return "", err
		}

		// create file watcher
		watcher, err := fsnotify.NewWatcher()
		if err != nil {
			return "", err
		}
		if err := watcher.Add(filepath.Join(folder, tmplFolder)); err != nil {
			return "", err
		}

		session := &syncSession{
			lastPing: time.Now(),
			folder:   filepath.Join(folder, tmplFolder),
			watcher:  watcher,
			close:    make(chan struct{}),
		}
		session.wg.Add(1)

		sessionsMtx.Lock()
		sessions[id] = session
		sessionsMtx.Unlock()

		go func() {
		watcher:
			for {
				select {
				case event, ok := <-watcher.Events:
					if !ok {
						return
					}
					if event.Op&fsnotify.Write == fsnotify.Write {
						updated, err := imexport.ImportGeneratorFolder(session.folder)
						if err != nil {
							_ = log.ErrorString(fmt.Sprintf("error in '%s' watcher: %s", session.folder, err))
							continue
						}

						updated.Slug = gen.Slug
						updated.Author = gen.Author

						if err := db.SaveGenerator(updated); err != nil {
							_ = log.ErrorString(fmt.Sprintf("error while saving templatae in '%s' watcher: %s", session.folder, err))
						}

						data, _ := json.Marshal(wsEvent{
							Type: "GeneratorUpdated/" + id,
							Data: nil,
						})

						_ = m.Broadcast(data)
					}
				case err, ok := <-watcher.Errors:
					if !ok {
						return
					}
					_ = log.ErrorString(fmt.Sprintf("error in '%s' watcher: %s", session.folder, err))
				case <-session.close:
					break watcher
				}
			}

			// remove session
			sessionsMtx.Lock()
			delete(sessions, id)
			sessionsMtx.Unlock()

			session.wg.Done()
		}()

		return filepath.Join(folder, tmplFolder), nil
	}

	bind.MustBind(route, "/syncStart", func(id string, folder string) (string, error) {
		sessionsMtx.Lock()

		_, ok := sessions[id]
		if ok {
			return "", errors.New("already running")
		}

		sessionsMtx.Unlock()

		if snd.IsTemplateID(id) {
			return syncTemplate(id, folder)
		} else if snd.IsGeneratorID(id) {
			return syncGenerator(id, folder)
		}

		return "", errors.New("not a valid id")
	})

	bind.MustBind(route, "/syncStop", func(id string) error {
		sessionsMtx.Lock()
		session, ok := sessions[id]
		if !ok {
			return errors.New("not synced")
		}

		session.close <- struct{}{}
		sessionsMtx.Unlock()

		session.wg.Wait()
		return nil
	})

	m.HandleMessage(func(s *melody.Session, bytes []byte) {
		var event wsEvent

		if err := json.Unmarshal(bytes, &event); err == nil {
			switch event.Type {
			case "KeepOpen":
				sessionsMtx.Lock()
				if val, ok := sessions[event.Data.(string)]; ok {
					val.lastPing = time.Now()
				}
				sessionsMtx.Unlock()
			}
		}
	})

}
