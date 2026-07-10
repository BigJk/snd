package tools5e

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// renderObject walks an arbitrary JSON-shaped value and rewrites any 5etools
// {@tags} it finds inside string leaves. It also collapses a top-level
// "entries" key into a single rendered "entry" string, matching how
// 5etools' converter pre-renders text before display.
//
// The walker is intentionally naive: it doesn't understand 5etools block
// types, it only descends into the structure. Block dispatch happens inside
// renderEntries/renderEntry, which only sees values that lived inside an
// entries list at some point.
func renderObject(data interface{}) interface{} {
	if dict, ok := data.(map[string]interface{}); ok {
		// Look for an entries map, and collapse the content into markdown.
		if entries, ok := dict["entries"].([]interface{}); ok {
			delete(dict, "entries")
			dict["entry"] = renderEntries(entries, "") // Top level, so prefix is empty

			// Manually render entry names.
			if name, ok := dict["name"].(string); ok {
				dict["name"] = renderString(name)
			}
		}

		// Recurse into the remaining leaves so sibling fields (e.g.
		// entriesHigherLevel, footer) also get their {@tags} rendered.
		// renderString is idempotent, so revisiting "entry"/"name" is safe.
		for key, value := range dict {
			dict[key] = renderObject(value)
		}
		return dict
	}

	if list, ok := data.([]interface{}); ok {
		for i, item := range list {
			list[i] = renderObject(item)
		}
		return list
	}

	if str, ok := data.(string); ok {
		return renderString(str)
	}

	return data
}

// renderEntries renders a list of entries to a markdown fragment. The prefix
// is the indentation information for the fragment and is appended after
// each internal newline. Used for contextual blocks.
func renderEntries(entries []interface{}, prefix string) string {
	paragraphs := make([]string, 0, len(entries))
	for _, entry := range entries {
		e, _ := renderEntry(entry, prefix)
		paragraphs = append(paragraphs, e)
	}
	return strings.Join(paragraphs, "\n"+prefix)
}

// renderEntry renders a single structured text entry. Strings are passed
// through renderString; maps with a "type" key are dispatched to renderBlock.
func renderEntry(entry interface{}, prefix string) (string, error) {
	if text, ok := entry.(string); ok {
		return renderString(text), nil
	}
	if block, ok := entry.(map[string]interface{}); ok {
		if blockType, ok := block["type"].(string); ok {
			return renderBlock(blockType, block, prefix), nil
		}
	}
	return "", errors.New("unsupported entry")
}

// renderString runs renderTag over every {@tag} occurrence in str and
// splices the results back together with the surrounding literal text.
func renderString(str string) string {
	head := 0
	out := ""
	tags := tagRegexp.FindAllStringSubmatchIndex(str, -1)
	for _, tag := range tags {
		tagType := str[tag[2]:tag[3]]
		tagContent := str[tag[4]:tag[5]]
		out = out + str[head:tag[0]] + renderTag(tagType, tagContent)
		head = tag[1]
	}
	return out + str[head:]
}

// toString converts a leaf value to its string representation, falling back
// to fmt.Sprintf("%v", ...) for non-strings.
func toString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return fmt.Sprintf("%v", v)
}

// stringList converts a list of string interfaces into a Go []string,
// silently skipping non-string entries.
func stringList(v []interface{}) []string {
	out := make([]string, 0, len(v))
	for _, x := range v {
		if s, ok := x.(string); ok {
			out = append(out, s)
		}
	}
	return out
}

// renderStringList renders a list of strings (e.g. a spell list) joined by
// ", ", passing each through renderString to honour {@tags}.
func renderStringList(v interface{}) string {
	list, ok := v.([]interface{})
	if !ok {
		return ""
	}
	parts := make([]string, 0, len(list))
	for _, item := range list {
		if s, ok := item.(string); ok {
			if r := renderString(s); r != "" {
				parts = append(parts, r)
			}
		}
	}
	return strings.Join(parts, ", ")
}

// plural returns "s" when n != 1, mirroring a tiny subset of English
// pluralisation used by the spellcasting renderer.
func plural(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}

// intFromKey converts a string key (like "1") to int; returns 0 if invalid.
// Used for the `recharge`/`legendary`/`charges` key form.
func intFromKey(s string) int {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return n
}

// parseSpellLevel interprets a key like "0", "1", "9" as the integer spell
// level. Returns ok=false for keys that aren't numeric (e.g. "cantrip").
func parseSpellLevel(s string) (int, bool) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, false
	}
	return n, true
}

// spellLevelLabel returns the human label for a level number, matching
// 5etools' Parser.spLevelToFull output for the common levels.
func spellLevelLabel(level int) string {
	labels := map[int]string{
		0: "Cantrips", 1: "1st level", 2: "2nd level", 3: "3rd level",
		4: "4th level", 5: "5th level", 6: "6th level", 7: "7th level",
		8: "8th level", 9: "9th level",
	}
	if label, ok := labels[level]; ok {
		return label
	}
	return fmt.Sprintf("Level %d", level)
}