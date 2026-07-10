package tools5e

import (
	"fmt"
	"sort"
	"strings"
)

// renderBlock dispatches to the appropriate block renderer based on the
// entry's "type" field. Unrecognised types fall through to a placeholder
// string so the surrounding text is still readable; new types should be
// added to the switch as they appear in the data.
func renderBlock(blockType string, block map[string]interface{}, prefix string) string {
	switch blockType {
	case "quote":
		return quoteBlock(block, prefix)
	case "list":
		return listBlock(block, prefix)
	case "entries":
		return entriesBlock(block, prefix)
	case "item":
		return namedItemBlock(block, "**", prefix)
	case "itemSub":
		return namedItemBlock(block, "*", prefix)
	case "variantSub":
		return variantSubBlock(block, prefix)
	case "inset":
		return insetBlock(block, prefix)
	case "table":
		return tableBlock(block, prefix)
	case "spellcasting":
		return spellcastingBlock(block, prefix)
	case "inline":
		return inlineBlock(block, prefix)
	case "optfeature":
		return entriesBlock(block, prefix)
	case "ability":
		return abilityBlock(block, prefix)
	case "bonus":
		return bonusBlock(block, prefix)
	case "bonusSpeed":
		return bonusSpeedBlock(block, prefix)
	case "actions":
		return entriesBlock(block, prefix)
	case "statblock":
		return statblockBlock(block, prefix)
	case "patron":
		return patronBlock(block, prefix)
	case "code":
		return codeBlock(block, prefix)
	case "section", "flow":
		// Section/flow blocks group other blocks; in markdown we just
		// flatten them to their inner entries.
		if entries, ok := block["entries"].([]interface{}); ok {
			return renderEntries(entries, prefix)
		}
		return ""
	case "hr":
		return prefix + "---"
	case "gallery", "image":
		// Visual blocks — markdown can't usefully render them, but we
		// emit a readable placeholder instead of "Unsuported Block".
		if caption, ok := block["caption"].(string); ok && caption != "" {
			return prefix + "[" + renderString(caption) + "]"
		}
		return prefix + "[image]"
	default:
		return prefix + "Unsuported Block: " + blockType
	}
}

// inlineHeaderTerminators mirrors Renderer._INLINE_HEADER_TERMINATORS in
// 5etools. Names ending in one of these characters already read as a
// complete phrase, so we skip appending the period that 5etools adds to
// inline headers like item / itemSub.
var inlineHeaderTerminators = func() map[rune]bool {
	return map[rune]bool{
		'.': true, ',': true, '!': true, '?': true,
		';': true, ':': true, '"': true,
	}
}()

// nameWithTrailingPeriod returns `name.` unless the name already ends in a
// terminator or `nameDot: false` was supplied on the block. Mirrors
// Renderer._renderItemSubtypes_isAddPeriod.
func nameWithTrailingPeriod(name string, raw map[string]interface{}) string {
	if name == "" {
		return ""
	}
	if v, ok := raw["nameDot"].(bool); ok && !v {
		return name
	}
	last := rune(name[len(name)-1])
	if inlineHeaderTerminators[last] {
		return name
	}
	return name + "."
}

// quoteBlock renders a quote with attribution. 5etools uses different quote
// styles ("italic" vs "callout") depending on the block; we treat them all
// the same since markdown only has one blockquote.
func quoteBlock(block map[string]interface{}, prefix string) string {
	entries, ok := block["entries"].([]interface{})
	if !ok {
		return ""
	}

	out := "> " + renderEntries(entries, prefix+"> ")

	attribution := make([]string, 0)
	if by, ok := block["by"].(string); ok {
		attribution = append(attribution, by)
	}
	if from, ok := block["from"].(string); ok {
		attribution = append(attribution, "*"+from+"*")
	}
	if len(attribution) > 0 {
		out = out + "\n> — " + strings.Join(attribution, ", ")
	}

	return out
}

// listBlock renders a 5etools list block as a bullet list. The 5etools
// `style` (e.g. "list-hang-notitle", "list-bullet") controls presentation
// in HTML; for markdown we always emit a bullet list with bold name + body,
// which matches the "list-hang-notitle" hang-indent style.
func listBlock(block map[string]interface{}, prefix string) string {
	items, ok := block["items"].([]interface{})
	if !ok {
		return ""
	}
	lines := make([]string, 0, len(items))
	for _, item := range items {
		// TODO: error handling
		e, _ := renderEntry(item, prefix+"  ")
		lines = append(lines, "+ "+e)
	}
	return strings.Join(lines, "\n")
}

// entriesBlock is the most common block type: an optional bold heading
// followed by an entries list. If `entriesHigherLevel` is present we append
// it as a deeper entries block (matching 5etools' spell upcast rendering).
func entriesBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = "**" + name + ".** "
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out = out + renderEntries(entries, prefix)
	}
	if higher, ok := block["entriesHigherLevel"].([]interface{}); ok && len(higher) > 0 {
		if out != "" {
			out += "\n" + prefix
		}
		out += "**At Higher Levels.** " + renderEntries(higher, prefix)
	}
	if footer, ok := block["footer"].(string); ok && footer != "" {
		out += "\n" + prefix + renderString(footer)
	}
	return out
}

// namedItemBlock renders an item / itemSub block. The wrapper controls
// whether the name is bold ("**") or italic ("*").
func namedItemBlock(block map[string]interface{}, wrapper string, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = wrapper + nameWithTrailingPeriod(name, block) + wrapper + " "
	}
	if entry, ok := block["entry"].(string); ok {
		out += renderString(entry)
	} else if entries, ok := block["entries"].([]interface{}); ok {
		out += renderEntries(entries, prefix)
	}
	return out
}

// variantSubBlock behaves like an entries block but is rendered without
// bolding its heading. In markdown this means a plain name followed by
// entries — same shape as entriesBlock minus the bold wrapper.
func variantSubBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = name + ".\n" + prefix
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += renderEntries(entries, prefix)
	}
	return out
}

// insetBlock renders a 5etools inset (a sidebar with a heading and body)
// as a bold heading followed by indented body text. In markdown we use a
// blockquote-like prefix to give it visual weight.
func insetBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = "**" + name + "**\n" + prefix
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += prefix + strings.ReplaceAll(renderEntries(entries, prefix), "\n", "\n"+prefix)
	}
	return out
}

// tableBlock renders a 5etools-shaped table (caption, colLabels, rows of
// either strings or {type:"cell", entry/roll, width}) as a GFM markdown
// table. Rollable cells use their `roll.exact` value when present.
func tableBlock(block map[string]interface{}, prefix string) string {
	var rows [][]string

	header := []string{}
	if cols, ok := block["colLabels"].([]interface{}); ok {
		for _, c := range cols {
			header = append(header, renderString(toString(c)))
		}
	}

	if rawRows, ok := block["rows"].([]interface{}); ok {
		for _, rr := range rawRows {
			rowData := rr
			if r, ok := rr.(map[string]interface{}); ok && r["type"] == "row" {
				if nested, ok := r["row"].([]interface{}); ok {
					rowData = nested
				}
			}
			row, ok := rowData.([]interface{})
			if !ok {
				continue
			}
			cells := make([]string, 0, len(row))
			for _, c := range row {
				cells = append(cells, cellToMarkdown(c))
			}
			rows = append(rows, cells)
		}
	}

	if len(header) == 0 && len(rows) == 0 {
		return ""
	}

	var b strings.Builder
	if caption, ok := block["caption"].(string); ok && caption != "" {
		b.WriteString("**")
		b.WriteString(renderString(caption))
		b.WriteString("**\n")
	}

	// Normalise header width against rows.
	width := len(header)
	for _, r := range rows {
		if len(r) > width {
			width = len(r)
		}
	}
	for len(header) < width {
		header = append(header, "")
	}

	b.WriteString(prefix)
	b.WriteString("| ")
	b.WriteString(strings.Join(header, " | "))
	b.WriteString(" |\n")
	b.WriteString(prefix)
	b.WriteString("|")
	for range header {
		b.WriteString(" --- |")
	}
	b.WriteString("\n")
	for _, r := range rows {
		for len(r) < width {
			r = append(r, "")
		}
		b.WriteString(prefix)
		b.WriteString("| ")
		b.WriteString(strings.Join(r, " | "))
		b.WriteString(" |\n")
	}
	return strings.TrimRight(b.String(), "\n")
}

// padRollNumber mirrors StrUtil.padNumber for rollable table cells where
// `pad: true` was supplied. It zero-pads the textual representation to two
// digits when the value is an integer in [0, 99].
func padRollNumber(v interface{}, roll map[string]interface{}) string {
	if padded, ok := roll["pad"].(bool); ok && padded {
		if n, ok := v.(float64); ok && n == float64(int(n)) && n >= 0 && n < 100 {
			return fmt.Sprintf("%02d", int(n))
		}
		if n, ok := v.(int); ok && n >= 0 && n < 100 {
			return fmt.Sprintf("%02d", n)
		}
	}
	return fmt.Sprintf("%v", v)
}

// cellToMarkdown converts a single table cell (string, number, or
// {type:"cell", entry/roll, width}) into a markdown-friendly string.
func cellToMarkdown(cell interface{}) string {
	switch c := cell.(type) {
	case nil:
		return ""
	case string:
		return renderString(c)
	default:
		m, ok := c.(map[string]interface{})
		if !ok {
			return renderString(toString(c))
		}
		if entry, ok := m["entry"].(string); ok {
			return renderString(entry)
		}
		if roll, ok := m["roll"].(map[string]interface{}); ok {
			if exact, ok := roll["exact"]; ok {
				return renderString(padRollNumber(exact, roll))
			}
			if min, ok := roll["min"]; ok {
				max, hasMax := roll["max"]
				if hasMax {
					dispMax := fmt.Sprintf("%v", max)
					if dispMax == "Infinity" || dispMax == "+Infinity" {
						return renderString(padRollNumber(min, roll) + "+")
					}
					return renderString(padRollNumber(min, roll) + "–" + padRollNumber(max, roll))
				}
				return renderString(fmt.Sprintf("%v", min))
			}
		}
		return renderString(toString(c))
	}
}

// spellcastingProps lists the spell-frequency properties recognised by
// 5etools' spellcasting renderer. The order matches 5etools so the output
// is stable.
var spellcastingProps = []string{
	"constant", "will", "recharge", "legendary", "charges",
	"rest", "restLong", "daily", "weekly", "monthly", "yearly", "ritual",
}

// spellDurationLabels mirrors 5etools' label text for each frequency prop.
var spellDurationLabels = map[string]string{
	"constant":  "Constant",
	"will":      "At will",
	"recharge":  "Recharge",
	"legendary": "Legendary",
	"charges":   "Charges",
	"rest":      "/rest",
	"restLong":  "/long rest",
	"daily":     "/day",
	"weekly":    "/week",
	"monthly":   "/month",
	"yearly":    "/year",
	"ritual":    "Rituals",
}

// spellcastingBlock renders a 5etools `type: "spellcasting"` block. The
// full 5etools renderer is complex (with sub-lists and per-level grouping);
// we render a faithful but compact markdown equivalent: header entries,
// one bullet per spell list, slot levels for `spells`, and footer entries.
func spellcastingBlock(block map[string]interface{}, prefix string) string {
	hidden := map[string]bool{}
	if h, ok := block["hidden"].([]interface{}); ok {
		for _, v := range h {
			if s, ok := v.(string); ok {
				hidden[s] = true
			}
		}
	}

	var out strings.Builder
	if name, ok := block["name"].(string); ok && name != "" {
		out.WriteString("**")
		out.WriteString(name)
		out.WriteString(".** ")
	}

	if headers, ok := block["headerEntries"].([]interface{}); ok && len(headers) > 0 {
		out.WriteString(renderEntries(headers, prefix))
	}

	// At-will / constant / recharge / per-day buckets.
	for _, prop := range spellcastingProps {
		if hidden[prop] {
			continue
		}
		raw, ok := block[prop]
		if !ok {
			continue
		}
		groups, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}
		keys := make([]string, 0, len(groups))
		for k := range groups {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		items := make([]string, 0, len(keys))
		for _, k := range keys {
			label := spellDurationLabels[prop]
			switch prop {
			case "recharge":
				label = "Recharge " + k
			case "legendary":
				label = k + " legendary action" + plural(intFromKey(k))
			case "charges":
				label = k + " charge" + plural(intFromKey(k))
			case "daily", "weekly", "monthly", "yearly":
				label = k + " " + spellDurationLabels[prop]
			}
			entry := renderStringList(groups[k])
			if entry == "" {
				continue
			}
			items = append(items, fmt.Sprintf("%s: %s", label, entry))
		}
		if len(items) > 0 {
			out.WriteString("\n")
			out.WriteString(prefix)
			for _, it := range items {
				out.WriteString("+ ")
				out.WriteString(it)
				out.WriteString("\n")
			}
		}
	}

	// Prepared spells by level.
	if raw, ok := block["spells"].(map[string]interface{}); ok && !hidden["spells"] {
		keys := make([]string, 0, len(raw))
		for k := range raw {
			keys = append(keys, k)
		}
		sort.Strings(keys)

		lines := make([]string, 0, len(keys))
		for _, k := range keys {
			lvl, ok := parseSpellLevel(k)
			if !ok {
				continue
			}
			entry, ok := raw[k].(map[string]interface{})
			if !ok {
				continue
			}
			levelLabel := spellLevelLabel(lvl)
			slotsLabel := ""
			if slots, ok := entry["slots"].(float64); ok {
				switch {
				case slots <= 0:
					slotsLabel = " (at will)"
				case slots == 1:
					slotsLabel = " (1 slot)"
				default:
					slotsLabel = fmt.Sprintf(" (%d slots)", int(slots))
				}
			}
			spells := renderStringList(entry["spells"])
			if spells == "" {
				spells = "—"
			}
			lines = append(lines, fmt.Sprintf("%s%s: %s", levelLabel, slotsLabel, spells))
		}
		if len(lines) > 0 {
			out.WriteString("\n")
			out.WriteString(prefix)
			for _, l := range lines {
				out.WriteString("+ ")
				out.WriteString(l)
				out.WriteString("\n")
			}
		}
	}

	if footers, ok := block["footerEntries"].([]interface{}); ok && len(footers) > 0 {
		if out.Len() > 0 {
			out.WriteString("\n")
		}
		out.WriteString(prefix)
		out.WriteString(renderEntries(footers, prefix))
	}

	return strings.TrimRight(out.String(), "\n")
}

// inlineBlock renders an `inline` block: just its entries with no
// decoration. Mirrors 5etools' `_renderInline`.
func inlineBlock(block map[string]interface{}, prefix string) string {
	if entries, ok := block["entries"].([]interface{}); ok {
		return renderEntries(entries, prefix)
	}
	return ""
}

// abilityBlock renders a centred `ability` block used by 2024 stat blocks
// for DC and attack-modifier displays. Falls back to bold heading + entries
// when the structured fields aren't present.
func abilityBlock(block map[string]interface{}, prefix string) string {
	name, _ := block["name"].(string)
	attributes, _ := block["attributes"].([]interface{})
	attrText := strings.Join(stringList(attributes), ", ")
	if attrText == "" {
		attrText = "ability"
	}

	var kind string
	switch {
	case block["dc"] != nil:
		kind = "save DC = 8 + your proficiency bonus + your " + attrText
	case block["attack"] != nil, block["attackMod"] != nil:
		kind = "attack modifier = your proficiency bonus + your " + attrText
	default:
		kind = attrText
	}

	out := "**" + name + " " + kind + "**"
	if text, ok := block["text"].(string); ok && text != "" {
		out += "\n" + prefix + renderString(text)
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += "\n" + prefix + renderEntries(entries, prefix)
	}
	return out
}

// bonusBlock renders a `bonus` block (typically used for bonus-action
// wrappers) as a bold heading with its entries below.
func bonusBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = "**" + name + ".** "
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += renderEntries(entries, prefix)
	}
	return out
}

// bonusSpeedBlock renders a speed adjustment block as "**Name.** Speed
// becomes ..." with the inner entries as content.
func bonusSpeedBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = "**" + name + ".** "
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += renderEntries(entries, prefix)
	}
	return out
}

// statblockBlock renders a nested statblock reference as a bold heading
// plus a brief hint that the inner statblock follows.
func statblockBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = "**" + name + "**"
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += "\n" + prefix + renderEntries(entries, prefix)
	}
	return out
}

// patronBlock renders a warlock-style patron block: a bold heading plus a
// description. Mirrors 5etools' `_renderPatron` which delegates to the
// entries-subtype renderer.
func patronBlock(block map[string]interface{}, prefix string) string {
	out := ""
	if name, ok := block["name"].(string); ok && name != "" {
		out = "**" + name + "**\n" + prefix
	}
	if entries, ok := block["entries"].([]interface{}); ok {
		out += renderEntries(entries, prefix)
	}
	return out
}

// codeBlock renders a 5etools `type: "code"` block as a fenced markdown
// code block. The block may also specify a language for syntax highlighting.
func codeBlock(block map[string]interface{}, prefix string) string {
	out := prefix + "```"
	if lang, ok := block["lang"].(string); ok && lang != "" {
		out += lang
	}
	out += "\n"
	if code, ok := block["code"].(string); ok {
		out += code
	} else if pre, ok := block["pre"].(string); ok {
		out += pre
	}
	if !strings.HasSuffix(out, "\n") {
		out += "\n"
	}
	out += prefix + "```"
	return out
}