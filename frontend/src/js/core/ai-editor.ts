import * as monaco from 'monaco-editor';

import * as API from 'js/core/api';

import { openPromptModal } from 'js/ui/components/modals/prompt';

import { error } from 'js/ui/toast';

export type AICodeEditorMode = 'generate' | 'edit';

type AiSystemPromptOptions = {
	/** Label inserted into "Keep the response valid for direct insertion into a <templateKind>" */
	templateKind: string;
	/** Printer width in px from settings */
	printerWidth: number;
	/** The Nunjucks context section (entity-specific) */
	nunjucksContext: string;
	/** The trailing data section shown after the context (e.g. skeleton JSON or config definition) */
	dataSummary: string;
};

/**
 * Builds the shared AI system prompt used by both the template and generator editors.
 * The thermal-printer constraints and general instructions are identical in both;
 * only the Nunjucks context docs and trailing data differ.
 */
export const buildAiSystemPrompt = (opts: AiSystemPromptOptions): string =>
	`
You are an expert HTML and Nunjucks template assistant for Sales & Dungeons.
Return code only.
Do not use markdown fences.
Do not explain the output.
Keep the response valid for direct insertion into a ${opts.templateKind}.

Output constraints:
- The final print is on a black-and-white thermal receipt printer.
- The printable width is limited to about ${opts.printerWidth}px.
- Use a narrow, single-column receipt-style layout.
- Avoid gradients, shadows, transparency effects, or color-dependent styling.
- Prefer strong contrast with simple borders/spacing for structure.
- Keep typography legible on small paper; avoid tiny text.
- Use at least around 22px as a baseline minimum font size for key text, otherwise thermal print output is often too small.
- Avoid relying on backgrounds or decorative effects that do not print well.
- If dynamic content with randomness is needed, prefer JavaScript output generation using \`.innerHTML\` or \`document.write()\`.
- For randomness, always use \`random()\` and never use \`Math.random()\` because \`random()\` is seeded.

Nunjucks context:
${opts.nunjucksContext}

${opts.dataSummary}
	`.trim();

type RunAICodeEditorActionProps = {
	editor?: monaco.editor.IStandaloneCodeEditor;
	mode: AICodeEditorMode;
	editSource: string;
	systemPrompt: string;
	buildUserPrompt: (prompt: string, selectedText: string, editorValue: string) => string;
	setLoading?: (loading: boolean) => void;
	descriptionGenerate: string;
	descriptionEdit: string;
	placeholderGenerate: string;
	placeholderEdit: string;
};

const extractCodeFromAIResponse = (content: string) => {
	const trimmed = content.trim();
	const fenced = trimmed.match(/^```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```$/);
	if (fenced && fenced[1]) {
		return fenced[1].trim();
	}
	return trimmed;
};

export const runAICodeEditorAction = (props: RunAICodeEditorActionProps) => {
	const editor = props.editor;
	if (!editor) return;

	const model = editor.getModel();
	if (!model) return;

	const selection = editor.getSelection();
	const hasSelection = !!selection && !selection.isEmpty();
	if (props.mode === 'edit' && !hasSelection) {
		error('Please select a code region to edit first.');
		return;
	}

	const selectedRange = selection
		? new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn)
		: null;
	const selectedText = selectedRange ? model.getValueInRange(selectedRange) : '';
	const editorValue = model.getValue();

	openPromptModal({
		title: props.mode === 'edit' ? 'Edit Selection with AI' : 'Generate with AI',
		label: 'Prompt',
		description: props.mode === 'edit' ? props.descriptionEdit : props.descriptionGenerate,
		placeholder: props.mode === 'edit' ? props.placeholderEdit : props.placeholderGenerate,
		multiline: true,
		rows: 8,
		buttonText: 'Generate',
		onSuccess: (prompt) => {
			if (prompt.trim().length === 0) {
				error('Prompt cannot be empty.');
				return;
			}

			const userPrompt = props.buildUserPrompt(prompt, selectedText, editorValue);

			props.setLoading?.(true);
			API.exec<string>(API.AI_GENERATE_CODING, props.systemPrompt, userPrompt)
				.then((response) => {
					const generated = extractCodeFromAIResponse(response);
					if (generated.length === 0) {
						error('AI returned an empty response.');
						return;
					}

					let range: monaco.Range;
					if (props.mode === 'edit' && selectedRange) {
						range = selectedRange;
					} else if (selection && !selection.isEmpty()) {
						range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
					} else {
						const position = editor.getPosition();
						if (!position) return;
						range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
					}

					editor.executeEdits(props.editSource, [
						{
							range,
							text: generated,
							forceMoveMarkers: true,
						},
					]);
				})
				.catch(error)
				.finally(() => {
					props.setLoading?.(false);
				});
		},
	});
};
