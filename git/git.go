package git

import (
	"net/http"
	"time"

	"github.com/go-git/go-git/v5/plumbing/transport/client"
	githttp "github.com/go-git/go-git/v5/plumbing/transport/http"
)

func init() {
	// set an 10-second timeout for http/https git operations.
	customClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	client.InstallProtocol("https", githttp.NewClient(customClient))
	client.InstallProtocol("http", githttp.NewClient(customClient))
}
