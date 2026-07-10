package tools5e

import (
	"encoding/json"
	"os"
	"strings"
	"testing"

	"github.com/BigJk/snd"
)

// Verifies the fix for `Unsuported Block: item` reports — items inside a
// list block use `type: "item"` with the content under `entry` (string) or
// `entries` (list), optionally preceded by `name`. They must render as a
// bulleted entry with a bolded name (matching the existing entriesBlock
// convention) instead of falling through to the unsupported-block branch.
func TestRenderBlock_Item(t *testing.T) {
	cases := []struct {
		name    string
		block   map[string]interface{}
		want    []string // substrings that must appear
		notWant []string
	}{
		{
			name: "name + single entry string",
			block: map[string]interface{}{
				"type":  "item",
				"name":  "Lightning Breath",
				"entry": "The dragon exhales lightning.",
			},
			want:    []string{"**Lightning Breath.**", "The dragon exhales lightning."},
			notWant: []string{"Unsuported Block"},
		},
		{
			name: "name + entries list",
			block: map[string]interface{}{
				"type": "item",
				"name": "Amphibious",
				"entries": []interface{}{
					"The dragon can breathe air and water.",
				},
			},
			want:    []string{"**Amphibious.**", "The dragon can breathe air and water."},
			notWant: []string{"Unsuported Block"},
		},
		{
			name: "no name + entry string",
			block: map[string]interface{}{
				"type":  "item",
				"entry": "Just some text.",
			},
			want:    []string{"Just some text."},
			notWant: []string{"Unsuported Block", "**.**"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := renderBlock("item", tc.block, "")
			for _, w := range tc.want {
				if !strings.Contains(got, w) {
					t.Errorf("renderBlock = %q, want to contain %q", got, w)
				}
			}
			for _, nw := range tc.notWant {
				if strings.Contains(got, nw) {
					t.Errorf("renderBlock = %q, must not contain %q", got, nw)
				}
			}
		})
	}
}

// End-to-end check: a `type: "list"` block whose items use `type: "item"`
// must render each item without producing "Unsuported Block" anywhere.
func TestRenderBlock_ListWithItems(t *testing.T) {
	block := map[string]interface{}{
		"type": "list",
		"items": []interface{}{
			map[string]interface{}{
				"type":  "item",
				"name":  "Lightning Breath",
				"entry": "A line of lightning.",
			},
			map[string]interface{}{
				"type": "item",
				"name": "Repulsion Breath",
				"entries": []interface{}{
					"A cone of repulsion energy.",
				},
			},
		},
	}

	got := listBlock(block, "")
	if strings.Contains(got, "Unsuported Block") {
		t.Fatalf("list block rendered unsupported item: %q", got)
	}
	for _, want := range []string{
		"+ **Lightning Breath.**",
		"A line of lightning.",
		"+ **Repulsion Breath.**",
		"A cone of repulsion energy.",
	} {
		if !strings.Contains(got, want) {
			t.Errorf("rendered output missing %q\n---\n%s\n---", want, got)
		}
	}
}

// Regression test for the user-reported "Unsuported Block: item" messages:
// feed a 5etools-shaped list block (as found in a dragon's breath-weapons
// action) through the full rendering pipeline and confirm nothing leaks
// through as unsupported. Also exercises the other newly-supported block
// types and the newly-supported {@tags} in one go.
func TestImport_NoUnsupportedBlocks(t *testing.T) {
	raw := map[string]interface{}{
		"monster": []interface{}{
			map[string]interface{}{
				"name":   "Test Dragon",
				"source": "TEST",
				"trait": []interface{}{
					map[string]interface{}{
						"name": "Variant: Optional Rules",
						"entries": []interface{}{
							"{@note See the {@book Monster Manual|MM} for details.}",
							map[string]interface{}{
								"type": "inset",
								"name": "Customising Dragons",
								"entries": []interface{}{
									"You can adjust languages, skills, and spells freely.",
									map[string]interface{}{
										"type": "itemSub",
										"name": "Rejuvenation",
										"entry": "If it has an essence-preserving object, a destroyed dragon gains a new body in {@dice 1d10} days.",
									},
									map[string]interface{}{
										"type": "variantSub",
										"entries": []interface{}{
											"An optional variant flavour.",
										},
									},
									map[string]interface{}{
										"type": "table",
										"colLabels": []interface{}{"AC", "Barding"},
										"rows": []interface{}{
											[]interface{}{"12", "Leather"},
											[]interface{}{"14", "Ring mail"},
										},
									},
								},
							},
						},
					},
				},
				"action": []interface{}{
					map[string]interface{}{
						"name": "Breath Weapons {@recharge 5}",
						"entries": []interface{}{
							"The dragon uses one of the following breath weapons. There is a {@chance 50|50 percent|50% summoning chance} it summons minions.",
							map[string]interface{}{
								"type":  "list",
								"style": "list-hang-notitle",
								"items": []interface{}{
									map[string]interface{}{
										"type":  "item",
										"name":  "Lightning Breath",
										"entry": "The dragon exhales lightning in a 90-foot line.",
									},
									map[string]interface{}{
										"type": "item",
										"name": "Repulsion Breath",
										"entries": []interface{}{
											"The dragon exhales repulsion energy in a 30-foot cone. See the {@variantrule Player Characters as Lycanthropes|MM|lycanthropy} rule.",
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	entries := importFixture(t, raw)
	if len(entries) == 0 || len(entries[0]) == 0 {
		t.Fatalf("expected at least one entry, got %d sources", len(entries))
	}

	data := entries[0][0].Data
	encoded, _ := json.Marshal(data)
	if strings.Contains(string(encoded), "Unsuported Block") {
		t.Fatalf("renderer emitted an unsupported block:\n%s", string(encoded))
	}
}

// Other block types seen in 5etools bestiary data that previously fell
// through to "Unsuported Block: …". The renderer should now produce a
// well-formed markdown rendering for each.
func TestRenderBlock_KnownUnsupportedTypes(t *testing.T) {
	t.Run("itemSub", func(t *testing.T) {
		block := map[string]interface{}{
			"type":  "itemSub",
			"name":  "1. Charm Ray",
			"entry": "The targeted creature must succeed on a save or be charmed.",
		}
		got := renderBlock("itemSub", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("itemSub fell through: %q", got)
		}
		// itemSub names are rendered italic in 5etools, with a trailing
		// period appended unless the name already ends in a terminator.
		if !strings.Contains(got, "*1. Charm Ray.*") {
			t.Errorf("expected italic name with period in %q", got)
		}
		if !strings.Contains(got, "charmed") {
			t.Errorf("expected entry text in %q", got)
		}
	})

	t.Run("itemSub auto-period", func(t *testing.T) {
		block := map[string]interface{}{
			"type":  "itemSub",
			"name":  "Slowing",
			"entry": "Speed is halved.",
		}
		got := renderBlock("itemSub", block, "")
		if !strings.Contains(got, "*Slowing.*") {
			t.Errorf("expected auto-period after unterminated name in %q", got)
		}
	})

	t.Run("itemSub nameDot=false", func(t *testing.T) {
		block := map[string]interface{}{
			"type":     "itemSub",
			"name":     "Slowing",
			"nameDot":  false,
			"entry":    "Speed is halved.",
		}
		got := renderBlock("itemSub", block, "")
		if strings.Contains(got, "*Slowing.*") {
			t.Errorf("expected no period when nameDot is false, got %q", got)
		}
	})

	t.Run("variantSub", func(t *testing.T) {
		block := map[string]interface{}{
			"type": "variantSub",
			"entries": []interface{}{
				"An optional sub-variant description.",
			},
		}
		got := renderBlock("variantSub", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("variantSub fell through: %q", got)
		}
		if !strings.Contains(got, "An optional sub-variant description.") {
			t.Errorf("missing entries content in %q", got)
		}
	})

	t.Run("table", func(t *testing.T) {
		block := map[string]interface{}{
			"type":      "table",
			"caption":   "Barding",
			"colLabels": []interface{}{"AC", "Barding"},
			"rows": []interface{}{
				[]interface{}{"12", "Leather"},
				[]interface{}{"14", "Ring mail"},
			},
		}
		got := renderBlock("table", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("table fell through: %q", got)
		}
		for _, want := range []string{"Barding", "| AC | Barding |", "| 12 | Leather |", "| 14 | Ring mail |"} {
			if !strings.Contains(got, want) {
				t.Errorf("table output missing %q\n---\n%s\n---", want, got)
			}
		}
	})

	t.Run("table with rollable cells", func(t *testing.T) {
		block := map[string]interface{}{
			"type":      "table",
			"colLabels": []interface{}{"d100", "Result"},
			"rows": []interface{}{
				[]interface{}{
					map[string]interface{}{
						"type": "cell",
						"roll": map[string]interface{}{"min": 1, "max": 10, "exact": 5},
					},
					"Low",
				},
				[]interface{}{
					map[string]interface{}{
						"type": "cell",
						"roll": map[string]interface{}{"min": 1, "max": 100},
					},
					"1–100",
				},
			},
		}
		got := renderBlock("table", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("table fell through: %q", got)
		}
		if !strings.Contains(got, "| 5 | Low |") {
			t.Errorf("expected exact cell value 5 in %q", got)
		}
		if !strings.Contains(got, "1–100") {
			t.Errorf("expected min–max range 1–100 in %q", got)
		}
	})

	t.Run("table with pad rolls", func(t *testing.T) {
		block := map[string]interface{}{
			"type":      "table",
			"colLabels": []interface{}{"d100", "Result"},
			"rows": []interface{}{
				[]interface{}{
					map[string]interface{}{
						"type": "cell",
						"roll": map[string]interface{}{"min": 1, "max": 10, "exact": 5, "pad": true},
					},
					"Low",
				},
			},
		}
		got := renderBlock("table", block, "")
		if !strings.Contains(got, "| 05 | Low |") {
			t.Errorf("expected zero-padded cell value 05 in %q", got)
		}
	})
}

// {@tags} that appear in 5etools bestiary data and used to fall through
// to the default case in renderTag, leaking raw pipe-separated content.
func TestRenderTag_KnownFallthroughTags(t *testing.T) {
	t.Run("chance picks display text", func(t *testing.T) {
		// 5etools only inspects the first two pipe segments for dice-flavour
		// tags, so the display text comes from `sections[1]`.
		got := renderTag("chance", "50|50 percent|50% summoning chance")
		if got != "50 percent" {
			t.Errorf("chance: got %q, want %q", got, "50 percent")
		}
	})

	t.Run("chance falls back to roll percent", func(t *testing.T) {
		got := renderTag("chance", "30")
		if got != "30 percent" {
			t.Errorf("chance fallback: got %q, want %q", got, "30 percent")
		}
	})

	t.Run("variantrule picks third pipe", func(t *testing.T) {
		got := renderTag("variantrule", "Player Characters as Lycanthropes|MM|lycanthropy")
		if got != "**Lycanthropy**" {
			t.Errorf("variantrule: got %q, want %q", got, "**Lycanthropy**")
		}
	})

	t.Run("book picks first pipe", func(t *testing.T) {
		got := renderTag("book", "Monster Manual|MM")
		if got != "Monster Manual" {
			t.Errorf("book: got %q, want %q", got, "Monster Manual")
		}
	})

	t.Run("status picks third pipe", func(t *testing.T) {
		got := renderTag("status", "concentration||concentrating")
		if got != "**Concentrating**" {
			t.Errorf("status: got %q, want %q", got, "**Concentrating**")
		}
	})

	t.Run("note picks first pipe", func(t *testing.T) {
		got := renderTag("note", "See the \"Variant\" inset, below.")
		if got != `See the "Variant" inset, below.` {
			t.Errorf("note: got %q", got)
		}
	})

	t.Run("homebrew replacement", func(t *testing.T) {
		got := renderTag("homebrew", "New fireball text|Old fireball text")
		if !strings.Contains(got, "New fireball text") || !strings.Contains(got, "Old fireball text") {
			t.Errorf("homebrew replacement: got %q", got)
		}
	})

	t.Run("homebrew addition only", func(t *testing.T) {
		got := renderTag("homebrew", "Additional feat")
		if !strings.Contains(got, "Additional feat") || !strings.Contains(got, "homebrew") {
			t.Errorf("homebrew addition: got %q", got)
		}
		if strings.Contains(got, "replacing") {
			t.Errorf("homebrew addition should not mention replacing: %q", got)
		}
	})

	t.Run("homebrew removal only", func(t *testing.T) {
		got := renderTag("homebrew", "|Removed section text")
		if !strings.Contains(got, "Removed section text") {
			t.Errorf("homebrew removal: got %q", got)
		}
	})

	t.Run("homebrew empty returns empty", func(t *testing.T) {
		if got := renderTag("homebrew", ""); got != "" {
			t.Errorf("homebrew empty: got %q", got)
		}
		if got := renderTag("homebrew", "|"); got != "" {
			t.Errorf("homebrew both empty: got %q", got)
		}
	})
}

// 5etools semantics for tags that we previously mis-rendered or didn't
// handle. Each case is a single-tag round-trip; the assertions match
// 5etools' output (or its markdown equivalent).
func TestRenderTag_FixedAndNew(t *testing.T) {
	t.Run("dc renders DC prefix", func(t *testing.T) {
		if got := renderTag("dc", "17"); got != "DC 17" {
			t.Errorf("dc: got %q, want %q", got, "DC 17")
		}
	})

	t.Run("dc respects display text", func(t *testing.T) {
		if got := renderTag("dc", "17|Display DC"); got != "DC Display DC" {
			t.Errorf("dc display: got %q, want %q", got, "DC Display DC")
		}
	})

	t.Run("hit always has sign", func(t *testing.T) {
		if got := renderTag("hit", "12"); got != "+12" {
			t.Errorf("hit positive: got %q", got)
		}
		if got := renderTag("hit", "-3"); got != "-3" {
			t.Errorf("hit negative: got %q", got)
		}
		if got := renderTag("hit", "0"); got != "+0" {
			t.Errorf("hit zero: got %q", got)
		}
	})

	t.Run("d20 formats with sign", func(t *testing.T) {
		if got := renderTag("d20", "5"); got != "+5" {
			t.Errorf("d20: got %q", got)
		}
	})

	t.Run("damage falls back to roll", func(t *testing.T) {
		if got := renderTag("damage", "2d6+3"); got != "2d6+3" {
			t.Errorf("damage roll: got %q", got)
		}
	})

	t.Run("damage display text wins", func(t *testing.T) {
		if got := renderTag("damage", "2d6+3|2d6 + 3"); got != "2d6 + 3" {
			t.Errorf("damage display: got %q", got)
		}
	})

	t.Run("damage replaces ; with /", func(t *testing.T) {
		if got := renderTag("damage", "2d6;1d6"); got != "2d6/1d6" {
			t.Errorf("damage semicolon: got %q", got)
		}
	})

	t.Run("ability score with modifier", func(t *testing.T) {
		if got := renderTag("ability", "str 12"); got != "12 (+1)" {
			t.Errorf("ability 12: got %q", got)
		}
		if got := renderTag("ability", "dex 20"); got != "20 (+5)" {
			t.Errorf("ability 20: got %q", got)
		}
		if got := renderTag("ability", "con 8"); got != "8 (-1)" {
			t.Errorf("ability 8: got %q", got)
		}
	})

	t.Run("ability display text wins", func(t *testing.T) {
		if got := renderTag("ability", "str 12|+5"); got != "+5" {
			t.Errorf("ability display: got %q", got)
		}
	})

	t.Run("unit singular", func(t *testing.T) {
		if got := renderTag("unit", "1|foot|feet"); got != "1 foot" {
			t.Errorf("unit singular: got %q", got)
		}
	})

	t.Run("unit plural explicit", func(t *testing.T) {
		if got := renderTag("unit", "5|foot|feet"); got != "5 feet" {
			t.Errorf("unit plural: got %q", got)
		}
	})

	t.Run("unit plural fallback", func(t *testing.T) {
		if got := renderTag("unit", "3|foot"); got != "3 foots" {
			t.Errorf("unit fallback plural: got %q", got)
		}
	})

	t.Run("area lowercase", func(t *testing.T) {
		if got := renderTag("area", "15-foot cone"); got != "area 15-foot cone" {
			t.Errorf("area: got %q", got)
		}
	})

	t.Run("area uppercase", func(t *testing.T) {
		if got := renderTag("area", "15-foot cone||u"); got != "Area 15-foot cone" {
			t.Errorf("area upper: got %q", got)
		}
	})

	t.Run("area compact flag", func(t *testing.T) {
		if got := renderTag("area", "15-foot cone||x"); got != "15-foot cone" {
			t.Errorf("area compact: got %q", got)
		}
	})

	t.Run("action triggers and responses", func(t *testing.T) {
		cases := []struct {
			tag, content, want string
		}{
			{"actTrigger", "", "Trigger:"},
			{"actResponse", "", "Response:"},
			{"actSave", "dex", "Dexterity Saving Throw:"},
			{"actSave", "", "Saving Throw:"},
			{"actSaveFail", "", "Failure:"},
			{"actSaveSuccess", "", "Success:"},
			{"actSaveSuccessOrFail", "", "Failure or Success:"},
			{"actSaveFailBy", "5", "Failure by 5 or More:"},
			{"actSaveFailBy", "", "Failure by ... or More:"},
		}
		for _, tc := range cases {
			t.Run(tc.tag, func(t *testing.T) {
				if got := renderTag(tc.tag, tc.content); got != tc.want {
					t.Errorf("%s(%q): got %q, want %q", tc.tag, tc.content, got, tc.want)
				}
			})
		}
	})

	t.Run("actSaveFail with ordinal", func(t *testing.T) {
		if got := renderTag("actSaveFail", "2"); got != "2nd Failure:" {
			t.Errorf("ordinal 2nd: got %q", got)
		}
		if got := renderTag("actSaveFail", "3"); got != "3rd Failure:" {
			t.Errorf("ordinal 3rd: got %q", got)
		}
		if got := renderTag("actSaveFail", "11"); got != "11th Failure:" {
			t.Errorf("ordinal 11th: got %q", got)
		}
	})

	t.Run("hitYourSpellAttack standalone", func(t *testing.T) {
		if got := renderTag("hitYourSpellAttack", ""); got != "your spell attack modifier" {
			t.Errorf("standalone: got %q", got)
		}
	})

	t.Run("dcYourSpellSave standalone", func(t *testing.T) {
		if got := renderTag("dcYourSpellSave", ""); got != "your spell save DC" {
			t.Errorf("standalone: got %q", got)
		}
	})

	t.Run("deity fourth pipe segment", func(t *testing.T) {
		got := renderTag("deity", "corellon|phb|0|Corellon Larethian")
		if got != "**Corellon Larethian**" {
			t.Errorf("deity: got %q", got)
		}
	})

	t.Run("subclass fifth pipe segment", func(t *testing.T) {
		got := renderTag("subclass", "wizard|phb|0|1|School of Evocation")
		if got != "**School Of Evocation**" {
			t.Errorf("subclass: got %q", got)
		}
	})

	t.Run("classFeature sixth pipe segment", func(t *testing.T) {
		got := renderTag("classFeature", "wizard|phb|0|1|Evocation|Sculpt Spells")
		if got != "**Sculpt Spells**" {
			t.Errorf("classFeature: got %q", got)
		}
	})

	t.Run("5etools first segment", func(t *testing.T) {
		if got := renderTag("5etools", "Source|extra"); got != "Source" {
			t.Errorf("5etools: got %q", got)
		}
	})

	t.Run("loader first segment", func(t *testing.T) {
		if got := renderTag("loader", "Common Name|extra"); got != "Common Name" {
			t.Errorf("loader: got %q", got)
		}
	})

	t.Run("color first segment", func(t *testing.T) {
		if got := renderTag("color", "fire|red|#f00"); got != "fire" {
			t.Errorf("color: got %q", got)
		}
	})
}

// Patron and code blocks previously fell through to "Unsuported Block".
func TestRenderBlock_PatronAndCode(t *testing.T) {
	t.Run("patron", func(t *testing.T) {
		block := map[string]interface{}{
			"type":    "patron",
			"name":    "The Archfey",
			"entries": []interface{}{"Your patron is a powerful fey creature."},
		}
		got := renderBlock("patron", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("patron fell through: %q", got)
		}
		if !strings.Contains(got, "**The Archfey**") {
			t.Errorf("missing name in %q", got)
		}
		if !strings.Contains(got, "powerful fey creature") {
			t.Errorf("missing entry in %q", got)
		}
	})

	t.Run("code without language", func(t *testing.T) {
		block := map[string]interface{}{
			"type": "code",
			"code": "console.log('hi');",
		}
		got := renderBlock("code", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("code fell through: %q", got)
		}
		if !strings.Contains(got, "```") {
			t.Errorf("missing fences in %q", got)
		}
		if !strings.Contains(got, "console.log") {
			t.Errorf("missing code body in %q", got)
		}
	})

	t.Run("code with language", func(t *testing.T) {
		block := map[string]interface{}{
			"type": "code",
			"lang": "javascript",
			"pre":  "let x = 1;",
		}
		got := renderBlock("code", block, "")
		if !strings.Contains(got, "```javascript") {
			t.Errorf("missing lang fence in %q", got)
		}
		if !strings.Contains(got, "let x = 1") {
			t.Errorf("missing pre body in %q", got)
		}
	})

	t.Run("section flattens to entries", func(t *testing.T) {
		block := map[string]interface{}{
			"type":    "section",
			"entries": []interface{}{"Just text."},
		}
		got := renderBlock("section", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("section fell through: %q", got)
		}
		if !strings.Contains(got, "Just text.") {
			t.Errorf("missing entry in %q", got)
		}
	})
}

// entriesHigherLevel and footer are sibling fields to `entries` on 5etools
// entries blocks (commonly used for spell upcast descriptions). Both should
// render through entriesBlock so their {@tags} are processed and their
// content is appended to the parent block.
func TestRenderBlock_EntriesHigherLevelAndFooter(t *testing.T) {
	t.Run("entriesHigherLevel appended", func(t *testing.T) {
		block := map[string]interface{}{
			"type":   "entries",
			"name":   "Fireball",
			"entries": []interface{}{"A bright streak flashes."},
			"entriesHigherLevel": []interface{}{
				"At 5th level, damage increases by {@damage 1d10}.",
			},
		}
		got := renderBlock("entries", block, "")
		if !strings.Contains(got, "A bright streak flashes.") {
			t.Errorf("missing base entries in %q", got)
		}
		if !strings.Contains(got, "**At Higher Levels.**") {
			t.Errorf("missing higher-levels heading in %q", got)
		}
		if !strings.Contains(got, "5th level") {
			t.Errorf("missing higher-levels body in %q", got)
		}
	})

	t.Run("footer string appended", func(t *testing.T) {
		block := map[string]interface{}{
			"type":    "entries",
			"name":    "Spell",
			"entries": []interface{}{"Body."},
			"footer":  "Classes: Wizard, Sorcerer.",
		}
		got := renderBlock("entries", block, "")
		if !strings.Contains(got, "Body.") {
			t.Errorf("missing body in %q", got)
		}
		if !strings.Contains(got, "Classes: Wizard, Sorcerer.") {
			t.Errorf("missing footer in %q", got)
		}
	})

	t.Run("entries without higher or footer unchanged", func(t *testing.T) {
		block := map[string]interface{}{
			"type":    "entries",
			"name":    "Plain",
			"entries": []interface{}{"Just a body."},
		}
		got := renderBlock("entries", block, "")
		if strings.Contains(got, "Higher Levels") {
			t.Errorf("unexpected higher-levels heading in %q", got)
		}
	})
}

// End-to-end: spell-shaped entries with entriesHigherLevel + footer should
// round-trip through the importer without losing content or leaking tags.
func TestImport_SpellWithHigherLevelAndFooter(t *testing.T) {
	raw := map[string]interface{}{
		"spell": []interface{}{
			map[string]interface{}{
				"name":   "Test Spell",
				"source": "TEST",
				"entries": []interface{}{
					"A test spell that deals {@damage 3d6} fire damage.",
				},
				"entriesHigherLevel": []interface{}{
					"At 5th level, damage increases by {@damage 1d6}.",
				},
				"footer": "Classes: Wizard.",
			},
		},
	}

	entries := importFixture(t, raw)
	if len(entries) == 0 || len(entries[0]) == 0 {
		t.Fatalf("expected at least one entry")
	}

	encoded, _ := json.Marshal(entries[0][0].Data)
	for _, want := range []string{
		"A test spell that deals 3d6 fire damage",
		"At 5th level",
		"Classes: Wizard",
	} {
		if !strings.Contains(string(encoded), want) {
			t.Errorf("missing %q in output:\n%s", want, string(encoded))
		}
	}
	// {@tags} should have been rendered, not left raw.
	if strings.Contains(string(encoded), "{@damage") {
		t.Errorf("raw {@damage} tag leaked through:\n%s", string(encoded))
	}
}

// Spellcasting blocks appear inside variant entries in 5etools bestiary
// data (e.g. hag covens). The renderer must not fall through to the
// unsupported branch and must produce a faithful markdown rendering.
func TestRenderBlock_Spellcasting(t *testing.T) {
	t.Run("minimal with spells", func(t *testing.T) {
		block := map[string]interface{}{
			"type": "spellcasting",
			"name": "Spellcasting",
			"headerEntries": []interface{}{
				"The acolyte is a 1st-level spellcaster.",
			},
			"spells": map[string]interface{}{
				"0": map[string]interface{}{
					"spells": []interface{}{"{@spell light}", "{@spell sacred flame}"},
				},
				"1": map[string]interface{}{
					"slots": 3.0,
					"spells": []interface{}{"{@spell bless}"},
				},
			},
			"ability": "wis",
		}
		got := renderBlock("spellcasting", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("spellcasting fell through: %q", got)
		}
		for _, want := range []string{
			"**Spellcasting.**",
			"1st-level spellcaster",
			"+ Cantrips:",
			"+ 1st level (3 slots):",
		} {
			if !strings.Contains(got, want) {
				t.Errorf("missing %q in\n%s", want, got)
			}
		}
	})

	t.Run("with at-will and daily", func(t *testing.T) {
		block := map[string]interface{}{
			"type": "spellcasting",
			"name": "Innate Spellcasting",
			"headerEntries": []interface{}{"Ability is Charisma."},
			"will":     map[string]interface{}{"": []interface{}{"{@spell detect magic}"}},
			"daily":    map[string]interface{}{"1": []interface{}{"{@spell charm person}"}},
			"footerEntries": []interface{}{"Footer text."},
		}
		got := renderBlock("spellcasting", block, "")
		if strings.Contains(got, "Unsuported Block") {
			t.Fatalf("fell through: %q", got)
		}
		for _, want := range []string{"+ At will:", "+ 1 /day:", "Footer text."} {
			if !strings.Contains(got, want) {
				t.Errorf("missing %q in\n%s", want, got)
			}
		}
	})

	t.Run("hidden props are skipped", func(t *testing.T) {
		block := map[string]interface{}{
			"type": "spellcasting",
			"name": "Spellcasting",
			"will":  map[string]interface{}{"": []interface{}{"{@spell light}"}},
			"hidden": []interface{}{"will"},
		}
		got := renderBlock("spellcasting", block, "")
		if strings.Contains(got, "At will") {
			t.Errorf("hidden 'will' should not appear: %q", got)
		}
	})
}

// Other block types observed across 5etools data sources (spells, items,
// classes, feats) that previously fell through.
func TestRenderBlock_OtherBlockTypes(t *testing.T) {
	cases := []struct {
		name    string
		typ     string
		block   map[string]interface{}
		want    []string
		notWant []string
	}{
		{
			name: "inline",
			typ:  "inline",
			block: map[string]interface{}{
				"type":    "inline",
				"entries": []interface{}{"Plain inline content."},
			},
			want:    []string{"Plain inline content."},
			notWant: []string{"Unsuported Block"},
		},
		{
			name: "optfeature",
			typ:  "optfeature",
			block: map[string]interface{}{
				"type":    "optfeature",
				"name":    "Optional Rule",
				"entries": []interface{}{"Some optional text."},
			},
			want:    []string{"**Optional Rule.**", "Some optional text."},
			notWant: []string{"Unsuported Block"},
		},
		{
			name: "bonus",
			typ:  "bonus",
			block: map[string]interface{}{
				"type":    "bonus",
				"name":    "Bonus Action",
				"entries": []interface{}{"Use a bonus action to do X."},
			},
			want:    []string{"**Bonus Action.**", "Use a bonus action to do X."},
			notWant: []string{"Unsuported Block"},
		},
		{
			name: "hr",
			typ:  "hr",
			block: map[string]interface{}{
				"type": "hr",
			},
			want:    []string{"---"},
			notWant: []string{"Unsuported Block"},
		},
		{
			name: "image",
			typ:  "image",
			block: map[string]interface{}{
				"type":    "image",
				"caption": "A hero portrait",
			},
			want:    []string{"[A hero portrait]"},
			notWant: []string{"Unsuported Block"},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := renderBlock(tc.typ, tc.block, "")
			for _, w := range tc.want {
				if !strings.Contains(got, w) {
					t.Errorf("missing %q in\n%s", w, got)
				}
			}
			for _, nw := range tc.notWant {
				if strings.Contains(got, nw) {
					t.Errorf("unexpected %q in\n%s", nw, got)
				}
			}
		})
	}
}

// Helper: writes raw as a temp JSON file and runs the importer on it.
func importFixture(t *testing.T, raw map[string]interface{}) [][]snd.Entry {
	t.Helper()
	tmp, err := os.CreateTemp("", "tools5e-fixture-*.json")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmp.Name())
	if err := json.NewEncoder(tmp).Encode(raw); err != nil {
		t.Fatal(err)
	}
	tmp.Close()

	_, entries, err := ImportFile(tmp.Name())
	if err != nil {
		t.Fatalf("ImportFile: %v", err)
	}
	return entries
}