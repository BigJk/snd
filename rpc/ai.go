package rpc

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BigJk/snd/rpc/bind"
	"io"
	"net/http"
	"time"

	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4"
	"github.com/patrickmn/go-cache"
	"github.com/samber/lo"
)

func shortHash(text string) string {
	hasher := sha1.New()
	hasher.Write([]byte(text))
	sha := base64.URLEncoding.EncodeToString(hasher.Sum(nil))
	return sha[:8]
}

var supportedProviders = []string{"OpenRouter.ai", "OpenAI", "Custom (e.g. Local)"}

func providerToEndpoint(db database.Database, provider string) (string, error) {
	switch provider {
	case "OpenRouter.ai":
		return "https://openrouter.ai/api", nil
	case "OpenAI":
		return "https://api.openai.com", nil
	case "Custom (e.g. Local)":
		settings, err := db.GetSettings()
		if err != nil {
			return "", err
		}
		if len(settings.AIURL) == 0 {
			return "", errors.New("custom AI provider URL is not set")
		}
		return settings.AIURL, nil
	default:
		return "", errors.New("unknown provider")
	}
}

func RegisterAI(route *echo.Group, db database.Database) {
	aiCache := cache.New(time.Minute*30, time.Minute)

	client := &http.Client{
		Timeout: time.Second * 60,
	}

	type AIMessage struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}

	type AIRequest struct {
		Model     string      `json:"model"`
		MaxTokens int         `json:"max_tokens"`
		Messages  []AIMessage `json:"messages"`
	}

	type AIResponse struct {
		ID      string `json:"id"`
		Model   string `json:"model"`
		Choices []struct {
			Message struct {
				Role    string `json:"role"`
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	bind.MustBind(route, "/aiCached", func(system string, user string, token string) (string, error) {
		cacheKey := fmt.Sprintf("%s-%s", shortHash(system+user), token)
		if val, ok := aiCache.Get(cacheKey); ok {
			return val.(string), nil
		}
		return "", errors.New("not cached")
	})

	bind.MustBind(route, "/aiPrompt", func(system string, user string, token string) (string, error) {
		settings, err := db.GetSettings()
		if err != nil {
			return "", err
		}

		if !settings.AIEnabled {
			return "", errors.New("AI is not enabled")
		}

		endpoint, err := providerToEndpoint(db, settings.AIProvider)
		if err != nil {
			return "", err
		}

		cacheKey := fmt.Sprintf("%s-%s", shortHash(system+user), token)
		if val, ok := aiCache.Get(cacheKey); ok {
			return val.(string), nil
		}

		prompt := AIRequest{
			Model:     settings.AIModel,
			MaxTokens: settings.AIMaxTokens,
			Messages: []AIMessage{
				{Role: "system", Content: system},
				{Role: "user", Content: user},
			},
		}

		if settings.AIProvider == "OpenAI" {
			prompt.MaxTokens -= len(system) + len(user)
		}

		body, err := json.Marshal(prompt)
		if err != nil {
			return "", err
		}

		req, err := http.NewRequest("POST", endpoint+"/v1/chat/completions", bytes.NewBuffer(body))
		if err != nil {
			return "", err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+settings.AIApiKey)
		req.Header.Set("HTTP-Referer", "https://sales-and-dungeons.app/")
		req.Header.Set("X-Title", "Sales & Dungeons")

		resp, err := client.Do(req)
		if err != nil {
			return "", err
		}

		var aiResp AIResponse
		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}

		err = json.Unmarshal(respBody, &aiResp)
		if err != nil {
			return "", err
		}

		// TODO: fix this hacky error handling
		if resp.StatusCode != http.StatusOK {
			var error map[string]map[string]interface{}
			err = json.Unmarshal(respBody, &error)
			if err != nil {
				return "", err
			}

			errMsg := error["error"]["message"].(string)
			if len(errMsg) > 0 {
				if errMsg[0] == '{' {
					if err := json.Unmarshal([]byte(errMsg), &error); err != nil {
						return "", err
					}
				}
			}

			return "", errors.New(error["error"]["message"].(string))
		}

		if len(aiResp.Choices) == 0 {
			return "", errors.New("no response from AI")
		}

		aiCache.Set(cacheKey, aiResp.Choices[0].Message.Content, cache.DefaultExpiration)

		return aiResp.Choices[0].Message.Content, nil
	})

	type Model struct {
		ID      string `json:"id"`
		Name    string `json:"name"`
		Pricing *struct {
			Prompt     any `json:"prompt"`
			Completion any `json:"completion"`
		} `json:"pricing,omitempty"`
		ContextLength    int `json:"context_length"`
		PerRequestLimits *struct {
			PromptTokens     any `json:"prompt_tokens"`
			CompletionTokens any `json:"completion_tokens"`
		} `json:"per_request_limits"`
	}

	type ModelsList struct {
		Data []Model `json:"data"`
	}

	bind.MustBind(route, "/aiProviders", func() ([]string, error) {
		return supportedProviders, nil
	})

	bind.MustBind(route, "/aiModels", func(provider string) ([]string, error) {
		// TODO: dynamically fetch models
		switch provider {
		case "OpenAI":
			return []string{"gpt-3.5-turbo", "gpt-3.5-turbo-1106", "gpt-3.5-turbo-16k", "gpt-4-1106-preview", "gpt-4", "gpt-4-32k"}, nil
		case "Custom (e.g. Local)":
			return []string{"Custom"}, nil
		}

		endpoint, err := providerToEndpoint(db, provider)
		if err != nil {
			return nil, err
		}

		resp, err := http.Get(endpoint + "/v1/models")
		if err != nil {
			return nil, err
		}

		res, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		var models ModelsList
		err = json.Unmarshal(res, &models)
		if err != nil {
			return nil, err
		}

		if models.Data == nil {
			return nil, errors.New("no models found")
		}

		return lo.Map(models.Data, func(model Model, i int) string {
			return model.ID
		}), nil
	}, cacheRpcFunction(10*time.Minute))
}
