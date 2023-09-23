package rpc

import (
	"bytes"
	"encoding/json"
	"errors"
	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/labstack/echo/v4"
	"github.com/samber/lo"
	"io/ioutil"
	"net/http"
	"time"
)

func RegisterAI(route *echo.Group, db database.Database) {
	client := &http.Client{
		Timeout: time.Second * 60,
	}

	type AIMessage struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}

	type AIRequest struct {
		Model    string      `json:"model"`
		Messages []AIMessage `json:"messages"`
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

	route.POST("/aiPrompt", echo.WrapHandler(nra.MustBind(func(system string, user string) (string, error) {
		settings, err := db.GetSettings()
		if err != nil {
			return "", err
		}

		if !settings.EnableAI {
			return "", errors.New("AI is not enabled")
		}

		if settings.AIProvider != "OpenRouter.ai" {
			return "", errors.New("AI provider is not supported")
		}

		prompt := AIRequest{
			Model: settings.AIModel,
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
			return "", errors.New("no response from AI")
		}

		if len(aiResp.Choices) == 0 {
			return "", errors.New("no response from AI")
		}

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

	route.POST("/aiOpenRouterModels", echo.WrapHandler(nra.MustBind(func() ([]string, error) {
		resp, err := http.Get("https://openrouter.ai/api/v1/models")
		if err != nil {
			return nil, err
		}

		var models OpenRouterModels
		err = json.NewDecoder(resp.Body).Decode(&models)
		if err != nil {
			return nil, err
		}

		return lo.Map(models.Data, func(model OpenRouterModel, i int) string {
			return model.ID
		}), nil
	})))
}
