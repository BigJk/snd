package tools5e

import (
	"fmt"
	"regexp"
	"strings"
)

// Regex helpers shared by ID/slug generation.
var (
	nonAlphanumericRegex = regexp.MustCompile(`[^a-zA-Z0-9 ]+`)
	spacesRegex          = regexp.MustCompile(`\s+`)
)

// makeID formats an arbitrary name into a valid snd entry ID, prefixed with
// the "5etools/" namespace so imports are distinguishable from manual data.
func makeID(str string) string {
	cleanStr := nonAlphanumericRegex.ReplaceAllString(str, "")
	kebabStr := spacesRegex.ReplaceAllString(cleanStr, "-")
	return fmt.Sprintf("5etools/%s", strings.ToLower(kebabStr))
}

// makeSlug formats an arbitrary name into a slug fragment suitable for use
// in DataSource.Slug. Unlike makeID it omits the "5etools/" prefix.
func makeSlug(str string) string {
	cleanStr := nonAlphanumericRegex.ReplaceAllString(str, "")
	kebabStr := spacesRegex.ReplaceAllString(cleanStr, "-")
	return strings.ToLower(kebabStr)
}