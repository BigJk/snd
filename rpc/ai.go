package rpc

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/log"
	"github.com/labstack/echo/v4"
	"github.com/patrickmn/go-cache"
	"github.com/samber/lo"
	"io/ioutil"
	"net/http"
	"time"
)

func shortHash(text string) string {
	hasher := sha1.New()
	hasher.Write([]byte(text))
	sha := base64.URLEncoding.EncodeToString(hasher.Sum(nil))
	return sha[:8]
}

func RegisterAI(route *echo.Group, db database.Database) {
	var aiCache = cache.New(time.Minute*30, time.Minute)

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

	route.POST("/aiCached", echo.WrapHandler(nra.MustBind(func(system string, user string, token string) (string, error) {
		cacheKey := fmt.Sprintf("%s-%s", shortHash(system+user), token)
		if val, ok := aiCache.Get(cacheKey); ok {
			return val.(string), nil
		}
		return "", errors.New("not cached")
	})))

	route.POST("/aiPrompt", echo.WrapHandler(nra.MustBind(func(system string, user string, token string) (string, error) {
		settings, err := db.GetSettings()
		if err != nil {
			return "", err
		}

		if !settings.AIEnabled {
			return "", errors.New("AI is not enabled")
		}

		if settings.AIProvider != "OpenRouter.ai" {
			return "", errors.New("AI provider is not supported")
		}

		cacheKey := fmt.Sprintf("%s-%s", shortHash(system+user), token)
		if val, ok := aiCache.Get(cacheKey); ok {
			return val.(string), nil
		}

		prompt := AIRequest{
			Model:     settings.AIModel,
			MaxTokens: 5000,
			Messages: []AIMessage{
				{Role: "system", Content: system},
				{Role: "user", Content: user},
			},
		}

		body, err := json.Marshal(prompt)
		if err != nil {
			return "", err
		}

		req, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(body))
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
		respBody, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return "", err
		}

		err = json.Unmarshal(respBody, &aiResp)
		if err != nil {
			return "", err
		}

		if resp.StatusCode != http.StatusOK {
			return "", errors.New(string(respBody))
		}

		if len(aiResp.Choices) == 0 {
			return "", errors.New("no response from AI")
		}

		aiCache.Set(cacheKey, aiResp.Choices[0].Message.Content, cache.DefaultExpiration)

		return aiResp.Choices[0].Message.Content, nil
	})))

	type OpenRouterModel struct {
		ID      string `json:"id"`
		Pricing struct {
			Prompt     string `json:"prompt"`
			Completion string `json:"completion"`
		} `json:"pricing,omitempty"`
		ContextLength    int `json:"context_length"`
		PerRequestLimits struct {
			PromptTokens     string `json:"prompt_tokens"`
			CompletionTokens string `json:"completion_tokens"`
		} `json:"per_request_limits"`
	}

	type OpenRouterModels struct {
		Data []OpenRouterModel `json:"data"`
	}

	// Fetch models from OpenRouter.ai
	var models OpenRouterModels
	go func() {
		for i := 0; i < 5 && models.Data == nil; i++ {
			resp, err := http.Get("https://openrouter.ai/api/v1/models")
			if err != nil {
				continue
			}

			err = json.NewDecoder(resp.Body).Decode(&models)
			if err != nil {
				continue
			}

			if models.Data != nil {
				log.Info("Fetched models from OpenRouter.ai")
				break
			}

			_ = log.ErrorString("Failed to fetch models from OpenRouter.ai, retrying in 1s")
			time.Sleep(time.Second * 1)
		}
	}()

	route.POST("/aiOpenRouterModels", echo.WrapHandler(nra.MustBind(func() ([]string, error) {
		return lo.Map(models.Data, func(model OpenRouterModel, i int) string {
			return model.ID
		}), nil
	})))
}
