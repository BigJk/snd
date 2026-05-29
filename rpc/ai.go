package rpc

import (
	"crypto/sha1"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/BigJk/snd/ai"
	"github.com/BigJk/snd/rpc/bind"

	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4"
)

func shortHash(text string) string {
	hasher := sha1.New()
	hasher.Write([]byte(text))
	sha := base64.URLEncoding.EncodeToString(hasher.Sum(nil))
	return sha[:8]
}

func providerToEndpoint(db database.Database, provider string) (string, error) {
	if provider != ai.ProviderCustom {
		return ai.EndpointForProvider(provider, "")
	}

	settings, err := db.GetSettings()
	if err != nil {
		return "", err
	}

	return ai.EndpointForProvider(provider, settings.AIURL)
}

func providerConfig(db database.Database, provider string, apiKey string) (ai.ProviderConfig, error) {
	endpoint, err := providerToEndpoint(db, provider)
	if err != nil {
		return ai.ProviderConfig{}, err
	}

	return ai.ProviderConfig{
		Provider: provider,
		Endpoint: endpoint,
		APIKey:   apiKey,
	}, nil
}

func RegisterAI(route *echo.Group, db database.Database) {
	client := ai.NewClient(&http.Client{Timeout: time.Second * 60})

	bind.MustBind(route, "/aiCached", func(system string, user string, token string) (string, error) {
		if len(token) == 0 {
			return "", errors.New("token is empty")
		}
		cacheKey := fmt.Sprintf("AI_CACHE_%s_%s", shortHash(system+user), token)
		if val, err := db.GetKey(cacheKey); err == nil {
			return val, nil
		}
		return "", errors.New("not cached")
	})

	bind.MustBind(route, "/aiInvalidateCached", func(token string) error {
		if len(token) == 0 {
			return errors.New("token is empty")
		}
		keys, err := db.GetKeysPrefix("AI_CACHE_")
		if err != nil {
			return err
		}
		for _, k := range keys {
			if strings.HasSuffix(k, token) {
				db.DeleteKey(k)
			}
		}
		return nil
	})

	bind.MustBind(route, "/aiPrompt", func(system string, user string, token string) (string, error) {
		settings, err := db.GetSettings()
		if err != nil {
			return "", err
		}

		if !settings.AIEnabled {
			return "", errors.New("AI is not enabled")
		}

		config, err := providerConfig(db, settings.AIProvider, settings.AIApiKey)
		if err != nil {
			return "", err
		}

		cacheKey := fmt.Sprintf("AI_CACHE_%s_%s", shortHash(system+user), token)
		if val, err := db.GetKey(cacheKey); err == nil {
			return val, nil
		}

		response, err := client.RunPrompt(config, ai.Prompt{
			Model:     settings.AIModel,
			MaxTokens: settings.AIMaxTokens,
			System:    system,
			User:      user,
		})
		if err != nil {
			return "", err
		}

		db.SetKey(cacheKey, response)

		return response, nil
	})

	bind.MustBind(route, "/aiCodingPrompt", func(system string, user string) (string, error) {
		settings, err := db.GetSettings()
		if err != nil {
			return "", err
		}

		if !settings.AIEnabled {
			return "", errors.New("AI is not enabled")
		}

		config, err := providerConfig(db, settings.AIProvider, settings.AIApiKey)
		if err != nil {
			return "", err
		}

		model := settings.AICodingModel
		if strings.TrimSpace(model) == "" {
			model = settings.AIModel
		}

		return client.RunPrompt(config, ai.Prompt{
			Model:     model,
			MaxTokens: settings.AIMaxTokens,
			System:    system,
			User:      user,
		})
	})

	bind.MustBind(route, "/aiProviders", func() ([]string, error) {
		return ai.SupportedProviders, nil
	})

	bind.MustBind(route, "/aiModels", func(provider string) ([]string, error) {
		switch provider {
		case ai.ProviderCustom:
			return []string{"Custom"}, nil
		}

		settings, err := db.GetSettings()
		if err != nil {
			return nil, err
		}

		config, err := providerConfig(db, provider, settings.AIApiKey)
		if err != nil {
			return nil, err
		}

		return client.ListModels(config)
	}, cacheRpcFunction(10*time.Minute))
}
