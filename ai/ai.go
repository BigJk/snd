package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	ProviderOpenRouter = "OpenRouter.ai"
	ProviderOpenAI     = "OpenAI"
	ProviderCustom     = "Custom (e.g. Local)"
)

var SupportedProviders = []string{ProviderOpenRouter, ProviderOpenAI, ProviderCustom}

type Client struct {
	httpClient *http.Client
}

type ProviderConfig struct {
	Provider string
	Endpoint string
	APIKey   string
}

type Prompt struct {
	Model     string
	MaxTokens int
	System    string
	User      string
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type PromptRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	Messages  []Message `json:"messages"`
}

type PromptResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

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

func NewClient(httpClient *http.Client) *Client {
	if httpClient == nil {
		httpClient = &http.Client{
			Timeout: time.Second * 60,
		}
	}

	return &Client{httpClient: httpClient}
}

func EndpointForProvider(provider string, customURL string) (string, error) {
	switch provider {
	case ProviderOpenRouter:
		return "https://openrouter.ai/api", nil
	case ProviderOpenAI:
		return "https://api.openai.com", nil
	case ProviderCustom:
		if len(customURL) == 0 {
			return "", errors.New("custom AI provider URL is not set")
		}
		return customURL, nil
	default:
		return "", errors.New("unknown provider")
	}
}

func (c *Client) RunPrompt(config ProviderConfig, prompt Prompt) (string, error) {
	if strings.TrimSpace(prompt.Model) == "" {
		return "", errors.New("AI model is not set")
	}

	request := PromptRequest{
		Model:     prompt.Model,
		MaxTokens: prompt.MaxTokens,
		Messages: []Message{
			{Role: "system", Content: prompt.System},
			{Role: "user", Content: prompt.User},
		},
	}

	if config.Provider == ProviderOpenAI {
		request.MaxTokens -= len(prompt.System) + len(prompt.User)
	}

	body, err := json.Marshal(request)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", config.Endpoint+"/v1/chat/completions", bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}

	setOpenAICompatibleHeaders(req, config.APIKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if strings.HasPrefix(string(respBody), "error code:") {
		return "", errors.New(string(respBody))
	}

	if resp.StatusCode != http.StatusOK {
		return "", responseError(respBody)
	}

	var aiResp PromptResponse
	err = json.Unmarshal(respBody, &aiResp)
	if err != nil {
		return "", err
	}

	if len(aiResp.Choices) == 0 {
		return "", errors.New("no response from AI")
	}

	return aiResp.Choices[0].Message.Content, nil
}

func (c *Client) ListModels(config ProviderConfig) ([]string, error) {
	req, err := http.NewRequest("GET", config.Endpoint+"/v1/models", nil)
	if err != nil {
		return nil, err
	}

	if config.Provider == ProviderOpenAI {
		if config.APIKey == "" {
			return nil, errors.New("OpenAI API key not set")
		}

		req.Header.Set("Authorization", "Bearer "+config.APIKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	res, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if strings.Contains(string(res), "invalid_api_key") {
		return nil, errors.New("invalid API key")
	}

	var models ModelsList
	err = json.Unmarshal(res, &models)
	if err != nil {
		return nil, err
	}

	if models.Data == nil {
		return nil, errors.New("no models found")
	}

	modelIDs := make([]string, 0, len(models.Data))
	for _, model := range models.Data {
		modelIDs = append(modelIDs, model.ID)
	}

	return modelIDs, nil
}

func setOpenAICompatibleHeaders(req *http.Request, apiKey string) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("HTTP-Referer", "https://sales-and-dungeons.app/")
	req.Header.Set("X-Title", "Sales & Dungeons")
}

func responseError(respBody []byte) error {
	var errorResponse map[string]map[string]interface{}
	err := json.Unmarshal(respBody, &errorResponse)
	if err != nil {
		return err
	}

	errMsg, ok := errorResponse["error"]["message"].(string)
	if !ok {
		return errors.New("AI request failed")
	}

	if len(errMsg) > 0 && errMsg[0] == '{' {
		if err := json.Unmarshal([]byte(errMsg), &errorResponse); err != nil {
			return err
		}
		if nestedErrMsg, ok := errorResponse["error"]["message"].(string); ok {
			errMsg = nestedErrMsg
		}
	}

	return errors.New(errMsg)
}
