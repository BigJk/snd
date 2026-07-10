package tools5e

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

// tagRegexp matches 5etools inline tags of the form {@tagName content}.
// The tag name is captured in group 1 and the (possibly empty) remainder
// in group 2. Content may itself contain nested braces (e.g. {@creature
// goblin|dmg|Goblin}); the [^\}] class means matching stops at the first
// closing brace, so nested tags need to be rendered from the inside out.
// In practice we only see one level of nesting in bestiary data.
var tagRegexp = regexp.MustCompile(`\{@([a-zA-z]+) ?([^\}]*)\}`)

// renderTag determines what we display instead of `{@tag content}`. The
// shape of the content varies per tag; we follow the 5etools semantics as
// closely as markdown allows.
func renderTag(tag string, content string) string {
	switch tag {
	case "italic", "i":
		return "*" + content + "*"
	case "bold", "b":
		return "**" + content + "**"
	case "code":
		return "`" + content + "`"
	case "atk":
		return attackTag(content)
	case "h":
		return "*Hit:* "
	case "hit":
		// Like 5etools: emit the numeric modifier with a leading "+" for
		// non-negative values. Content is just the roll number.
		n, err := strconv.Atoi(content)
		if err != nil {
			return content
		}
		if n >= 0 {
			return fmt.Sprintf("+%d", n)
		}
		return strconv.Itoa(n)
	case "dice":
		// In future we may want to parse the 5etools dice format, but this is good enough for now.
		return pipedDisplayText(content, 1)
	case "damage":
		// Same shape as @dice (splitTagByPipe: rollText, displayText).
		// 5etools renders `displayText || rollText.replace(/;/g, "/")` for damage.
		sections := strings.Split(content, "|")
		rollText := sections[0]
		displayText := ""
		if len(sections) >= 2 {
			displayText = sections[1]
		}
		if displayText != "" {
			return displayText
		}
		return strings.ReplaceAll(rollText, ";", "/")
	case "d20":
		// d20 + modifier; fall back to the raw text when not numeric.
		sections := strings.Split(content, "|")
		rollText := sections[0]
		displayText := ""
		if len(sections) >= 2 {
			displayText = sections[1]
		}
		if displayText != "" {
			return displayText
		}
		if n, err := strconv.Atoi(rollText); err == nil {
			if n >= 0 {
				return fmt.Sprintf("+%d", n)
			}
			return strconv.Itoa(n)
		}
		return rollText
	case "initiative":
		return diceFlavor(content, "+0")
	case "savingThrow":
		return diceFlavor(content, content)
	case "skillCheck":
		return diceFlavor(content, content)
	case "dc":
		// 5etools renders `DC <displayText || dcText>` where dcText is the
		// first pipe segment and displayText is the second. The plain number
		// in bestiary data goes through this path with no display text.
		sections := strings.SplitN(content, "|", 2)
		dcText := sections[0]
		displayText := ""
		if len(sections) == 2 {
			displayText = sections[1]
		}
		if displayText != "" {
			return "DC " + displayText
		}
		return "DC " + dcText
	case "hitYourSpellAttack":
		// Standalone phrase; optional display text in segments[0].
		if content == "" {
			return "your spell attack modifier"
		}
		return pipedDisplayText(content, 0)
	case "dcYourSpellSave":
		if content == "" {
			return "your spell save DC"
		}
		return pipedDisplayText(content, 0)
	case "recharge":
		if len(content) > 0 {
			n, err := strconv.Atoi(content)
			if err == nil {
				if n < 6 {
					return fmt.Sprintf("(Recharge %d\u20136)", n)
				}
				return fmt.Sprintf("(Recharge %d)", n)
			}
			return fmt.Sprintf("(Recharge %s-6)", content)
		}
		return "(Recharge 6)"
	case "ability":
		return abilityTag(content)
	case "unit":
		return unitTag(content)
	case "area":
		return areaTag(content)
	case "actTrigger":
		return "Trigger:"
	case "actResponse":
		// 5etools adds an em-dash when the content includes "d" (which signals
		// a damage roll context); for markdown we keep the colon in both
		// cases, which is readable and avoids leaking the heuristic.
		return "Response:"
	case "actSave":
		// content is the ability abbreviation, e.g. "dex" → "Dexterity Saving Throw:".
		attr := strings.TrimSpace(content)
		if attr == "" {
			return "Saving Throw:"
		}
		if full, ok := abilityAbbreviations[strings.ToLower(attr)]; ok {
			return full + " Saving Throw:"
		}
		return strings.ToUpper(attr[:1]) + strings.ToLower(attr[1:]) + " Saving Throw:"
	case "actSaveFail":
		return actSaveOutcomeTag(content, "Failure")
	case "actSaveSuccess":
		return "Success:"
	case "actSaveSuccessOrFail":
		return "Failure or Success:"
	case "actSaveFailBy":
		// content is the threshold number; emit "Failure by N or More:".
		if content == "" {
			return "Failure by ... or More:"
		}
		return "Failure by " + content + " or More:"
	case "filter", "footnote", "book", "5etools", "loader", "color", "highlight", "help",
		"sup", "sub", "kbd", "font", "style":
		// Tags with multiple sections where we always render the first one.
		// Mirrors 5etools' `_TagTextStyle` and `_TagPipedNoDisplayText`.
		sections := strings.Split(content, "|")
		if len(sections) == 0 {
			return ""
		}
		return sections[0]
	case "link":
		// Tags with optional link text after the first pipe.
		sections := strings.Split(content, "|")
		if len(sections) >= 2 {
			return "**" + sections[1] + "**"
		}
		return "**" + sections[0] + "**"
	case "spell", "item", "creature", "legroup", "background", "race", "optfeature", "class",
		"subclassFeature", "condition", "disease", "reward", "feat", "psionic", "object",
		"boon", "cult", "trap", "hazard", "deities", "variantRule", "vehicle", "vehupgrade", "table",
		"action", "language", "charoption", "recipe", "deck", "variantrule", "status", "cite":
		// Most link tags use the third pipe segment as the display text.
		return pipedDisplayText(content, 2)
	case "deity", "card":
		// _TagPipedDisplayTextFourth: fourth pipe segment.
		return pipedDisplayText(content, 3)
	case "subclass":
		// _TagPipedDisplayTextFifth: fifth pipe segment (subclass name).
		return pipedDisplayText(content, 4)
	case "classFeature":
		// _TagPipedDisplayTextSixth: sixth pipe segment (class feature name).
		return pipedDisplayText(content, 5)
	case "quickref":
		// 5etools' quickref tag uses UID-form content. Real-world entries
		// place the display text in segment 4; we fall back to segment 0
		// (the section name) when the display text is absent.
		sections := strings.Split(content, "|")
		if len(sections) >= 5 && sections[4] != "" {
			return "**" + sections[4] + "**"
		}
		if len(sections) > 0 {
			return "**" + sections[0] + "**"
		}
		return ""
	case "chance":
		// Like `@dice`: pick the second pipe segment as display text, fall
		// back to the roll value followed by " percent".
		sections := strings.Split(content, "|")
		rollText := sections[0]
		displayText := ""
		if len(sections) >= 2 {
			displayText = sections[1]
		}
		if displayText != "" {
			return displayText
		}
		return rollText + " percent"
	case "note":
		// Inline note text, mirrors 5etools `_TagTextStyle`: first pipe segment.
		sections := strings.SplitN(content, "|", 2)
		if len(sections) == 0 {
			return ""
		}
		return sections[0]
	case "homebrew":
		// Homebrew annotations: content is `newText|oldText`. 5etools renders
		// one of three messages depending on which side is present.
		sections := strings.SplitN(content, "|", 2)
		newText, oldText := "", ""
		if len(sections) >= 1 {
			newText = sections[0]
		}
		if len(sections) >= 2 {
			oldText = sections[1]
		}
		switch {
		case newText != "" && oldText != "":
			return fmt.Sprintf("%s [homebrew, replacing: %s]", newText, oldText)
		case newText != "":
			return fmt.Sprintf("%s [homebrew]", newText)
		case oldText != "":
			return fmt.Sprintf("[removed by homebrew: %s]", oldText)
		default:
			return ""
		}
	default:
		// Unknown tags fall through with the raw content, preserving any
		// pipe-separated data (callers can decide whether that's acceptable).
		return content
	}
}

// pipedDisplayText returns the pipe-segment at `idx` if present, otherwise
// the first segment. Mirrors 5etools' `_TagPipedDisplayText{N}` family
// (with `idx` = N-1).
func pipedDisplayText(content string, idx int) string {
	sections := strings.Split(content, "|")
	if idx < len(sections) && sections[idx] != "" {
		return "**" + strings.Title(sections[idx]) + "**"
	}
	if len(sections) > 0 {
		return "**" + strings.Title(sections[0]) + "**"
	}
	return ""
}

// diceFlavor handles the `@initiative`/`@savingThrow`/`@skillCheck` family.
// 5etools renders `displayText || rollText`; we mirror that with a fallback
// default for the empty-content case (used by @initiative with no roll).
func diceFlavor(content string, fallback string) string {
	sections := strings.SplitN(content, "|", 2)
	if len(sections) == 2 && sections[1] != "" {
		return sections[1]
	}
	if len(sections) > 0 && sections[0] != "" {
		return sections[0]
	}
	return fallback
}

// abilityTag renders `{@ability str 12}` or `{@ability str 12|Display}` as
// "12 (+1)" or the display text. 5etools computes the modifier with
// Parser.getAbilityModNumber(score) = floor((score - 10) / 2).
func abilityTag(content string) string {
	sections := strings.Split(content, "|")
	rollText := sections[0]
	displayText := ""
	if len(sections) >= 2 {
		displayText = sections[1]
	}
	if displayText != "" {
		return displayText
	}
	// rollText is "abbr score", e.g. "str 12".
	parts := strings.Fields(rollText)
	if len(parts) < 2 {
		return rollText
	}
	score, err := strconv.Atoi(parts[1])
	if err != nil {
		return rollText
	}
	mod := int(math.Floor(float64(score-10) / 2))
	if mod >= 0 {
		return fmt.Sprintf("%d (+%d)", score, mod)
	}
	return fmt.Sprintf("%d (%d)", score, mod)
}

// unitTag renders `{@unit 5|foot|feet}` as "5 feet" or "foot" depending on
// count, pluralising `unitSingle` with a trailing "s" when no `unitPlural`
// is provided. Mirrors 5etools' `TagUnit` exactly.
func unitTag(content string) string {
	sections := strings.Split(content, "|")
	amount, unitSingle, unitPlural := "", "", ""
	if len(sections) >= 1 {
		amount = sections[0]
	}
	if len(sections) >= 2 {
		unitSingle = sections[1]
	}
	if len(sections) >= 3 {
		unitPlural = sections[2]
	}
	// If the amount is non-numeric (i.e. a label), just return the singular.
	if _, err := strconv.Atoi(amount); err != nil {
		return unitSingle
	}
	n, _ := strconv.Atoi(amount)
	if n > 1 {
		if unitPlural != "" {
			return amount + " " + unitPlural
		}
		return amount + " " + unitSingle + "s"
	}
	return amount + " " + unitSingle
}

// areaTag renders `{@area 15-foot cone}` as "a 15-foot cone" (or "A ..." for
// uppercase via the "u" flag, or just the compact text via the "x" flag).
func areaTag(content string) string {
	sections := strings.SplitN(content, "|", 3)
	compactText := ""
	flags := ""
	if len(sections) >= 1 {
		compactText = sections[0]
	}
	if len(sections) >= 3 {
		flags = sections[2]
	}
	if strings.Contains(flags, "x") {
		return compactText
	}
	prefix := "a"
	if strings.Contains(flags, "u") {
		prefix = "A"
	}
	return prefix + "rea " + compactText
}

// actSaveOutcomeTag renders `{@actSaveFail}` and `{@actSaveFail 2}` (which
// becomes "Second Failure:" via Parser.numberToText). We approximate the
// ordinal text by appending "th"/"st"/"rd" for the common cases.
func actSaveOutcomeTag(content string, base string) string {
	if content == "" {
		return base + ":"
	}
	n, err := strconv.Atoi(content)
	if err != nil {
		return base + ":"
	}
	var ordinal string
	switch {
	case n%100 >= 11 && n%100 <= 13:
		ordinal = strconv.Itoa(n) + "th"
	case n%10 == 1:
		ordinal = strconv.Itoa(n) + "st"
	case n%10 == 2:
		ordinal = strconv.Itoa(n) + "nd"
	case n%10 == 3:
		ordinal = strconv.Itoa(n) + "rd"
	default:
		ordinal = strconv.Itoa(n) + "th"
	}
	return ordinal + " " + base + ":"
}

// attackTag renders the @atk shorthand back into readable text. The 5etools
// format is one or more comma-separated pairs of (m|r|a)(w|s) characters.
// m = melee, r = ranged, a = area; w = weapon, s = spell.
func attackTag(attackTypes string) string {
	attacks := make([]string, 0)
	for _, attackType := range strings.Split(attackTypes, ",") {
		attack := ""
		if strings.Contains(attackType, "m") {
			attack = attack + "Melee "
		} else if strings.Contains(attackType, "r") {
			attack = attack + "Ranged "
		} else if strings.Contains(attackType, "a") {
			attack = attack + "Area "
		}
		if strings.Contains(attackType, "w") {
			attack = attack + "Weapon "
		} else if strings.Contains(attackType, "s") {
			attack = attack + "Spell "
		}
		attacks = append(attacks, attack)
	}
	return "*" + strings.Join(attacks, "or ") + "Attack:*"
}

// abilityAbbreviations maps the short codes 5etools uses in @actSave (and
// elsewhere) to their full English names.
var abilityAbbreviations = map[string]string{
	"str": "Strength",
	"dex": "Dexterity",
	"con": "Constitution",
	"int": "Intelligence",
	"wis": "Wisdom",
	"cha": "Charisma",
}