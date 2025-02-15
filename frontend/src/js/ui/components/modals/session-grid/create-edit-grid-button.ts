import m from 'mithril';

import { GridElement, GridGeneratorElement, GridTemplateElement, isGridGeneratorElement, isGridTemplateElement } from 'js/types/session-grid';
import { buildId } from 'src/js/types/basic-info';
import { safePromise } from 'js/core/safe';
import { getGridGeneratorConfigChoices, getGridTemplateChoices } from 'js/core/session-grid';
import { generators, templates } from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import Checkbox from 'js/ui/shoelace/checkbox';
import ColorPicker from 'js/ui/shoelace/color-picker';
import Input from 'js/ui/shoelace/input';
import Modal from 'js/ui/shoelace/modal';
import Select from 'js/ui/shoelace/select';

import HorizontalProperty from 'js/ui/components/horizontal-property';
import Grid from 'js/ui/components/layout/grid';
import GridButton from 'js/ui/components/session-grid/grid-button';

import { popPortal, pushPortal } from 'js/ui/portal';

type CreateEditGridButtonProps = {
	element?: GridElement;
	onSuccess: (element: GridElement) => void;
};

type CreateEditGridButtonState = {
	isNew: boolean;
	type?: 'template' | 'generator';
	element?: GridElement;
	choiceSearch: string;
	choicesTemplate: {
		id: string;
		name: string;
		source?: string;
	}[];
	choicesGenerator: string[];
};

const createEditGridButton = (props: CreateEditGridButtonProps) => (): m.Component => {
	let state: CreateEditGridButtonState = {
		isNew: !props.element,
		type: (() => {
			if (!props.element) {
				return undefined;
			}

			if (isGridTemplateElement(props.element)) {
				return 'template';
			}
			if (isGridGeneratorElement(props.element)) {
				return 'generator';
			}

			return undefined;
		})(),
		element: props.element,
		choiceSearch: '',
		choicesTemplate: [],
		choicesGenerator: [],
	};

	const fetchChoices = async () => {
		if (isGridTemplateElement(state.element)) {
			state.choicesTemplate = await getGridTemplateChoices(state.element, state.choiceSearch);
		}

		if (isGridGeneratorElement(state.element)) {
			const res = await safePromise(getGridGeneratorConfigChoices(state.element));
			if (!res.hasError) {
				state.choicesGenerator = res.value;
			} else {
				state.choicesGenerator = [];
			}
		}
	};

	const typeSelector = () =>
		m(Select, {
			keys: ['template', 'generator'],
			names: ['Template', 'Generator'],
			selected: state.type,
			onInput: (e) => {
				state.type = e.target.value as 'template' | 'generator';
				switch (state.type) {
					case 'template':
						state.element = {
							templateId: '',
						};
						break;
					case 'generator':
						state.element = {
							generatorId: '',
						};
						break;
				}
			},
		});

	const editor = () => {
		const base: any = [
			m(
				HorizontalProperty,
				{
					label: 'Button Name',
					description: 'Leave empty to use the template/generator name',
					bottomBorder: true,
					centered: true,
				},
				m(Input, { value: state.element?.name, placeholder: '', onChange: (val: string) => (state.element!.name = val) }),
			),
			m(
				HorizontalProperty,
				{
					label: 'Button Color',
					description: 'Leave empty to use the default',
					bottomBorder: true,
					centered: true,
				},
				m(ColorPicker, {
					value: state.element?.color,
					onChange: (val: string) => (state.element!.color = val),
				}),
			),
		];

		switch (state.type) {
			case 'template':
				if (!isGridTemplateElement(state.element)) {
					break;
				}
				base.push(
					...[
						m(
							HorizontalProperty,
							{
								label: 'Template',
								description: 'Select a template to use for this button',
								bottomBorder: true,
								centered: true,
							},
							m(Select, {
								keys: templates.value.map((t) => buildId('template', t)),
								names: templates.value.map((t) => t.name),
								selected: state.element.templateId,
								onInput: (e) => {
									if (!isGridTemplateElement(state.element)) {
										return;
									}
									state.element!.templateId = e.target.value;
									state.element!.entryId = undefined;
									fetchChoices();
								},
							}),
						),
						m(
							HorizontalProperty,
							{
								label: 'Entry',
								description: 'Pick an entry to use for this button. Can be left empty.',
								bottomBorder: true,
								centered: true,
							},
							m(Select, {
								keys: state.choicesTemplate.map((t) => t.id),
								names: state.choicesTemplate.map((t) => t.name),
								selected: state.element.entryId,
								clearable: true,
								onInput: (e) => {
									if (!isGridTemplateElement(state.element)) {
										return;
									}
									state.element!.entryId = e.target.value;
									state.element!.dataSourceId = state.choicesTemplate.find((t) => t.id === e.target.value)?.source;
								},
							}),
						),
					],
				);
				break;
			case 'generator':
				if (!isGridGeneratorElement(state.element)) {
					break;
				}
				base.push(
					...[
						m(
							HorizontalProperty,
							{
								label: 'Generator',
								description: 'Select a generator to use for this button',
								bottomBorder: true,
								centered: true,
							},
							m(Select, {
								keys: generators.value.map((g) => buildId('generator', g)),
								names: generators.value.map((g) => g.name),
								selected: state.element.generatorId,
								onInput: (e) => {
									if (!isGridGeneratorElement(state.element)) {
										return;
									}
									state.element!.generatorId = e.target.value;
									state.element!.configName = undefined;
									fetchChoices();
								},
							}),
						),
						state.choicesGenerator.length > 0
							? m(
									HorizontalProperty,
									{
										label: 'Config',
										description: 'Pick an config to use for this button. Can be left empty.',
										bottomBorder: true,
										centered: true,
									},
									m(Select, {
										keys: state.choicesGenerator,
										selected: state.element.configName,
										clearable: true,
										onInput: (e) => {
											if (!isGridGeneratorElement(state.element)) {
												return;
											}
											state.element!.configName = e.target.value;
										},
									}),
								)
							: null,
						m(
							HorizontalProperty,
							{
								label: 'AI Enabled',
								description: 'Whether to enable AI for this button',
								bottomBorder: true,
								centered: true,
							},
							m(Checkbox, {
								checked: state.element.aiEnabled,
								onChange: (val: boolean) => {
									if (!isGridGeneratorElement(state.element)) {
										return;
									}
									state.element!.aiEnabled = val;
								},
							}),
						),
					],
				);
				break;
		}

		return m('div', [
			...base,
			m(
				Button,
				{
					intend: 'success',
					className: '.mt2',
					disabled: !(state.element as GridTemplateElement)?.templateId && !(state.element as GridGeneratorElement)?.generatorId,
					onClick: () => {
						if (state.element) {
							props.onSuccess(state.element);
						}
						popPortal();
					},
				},
				'Submit',
			),
		]);
	};

	return {
		view: () =>
			m(
				Modal,
				{
					width: !state.type ? '500px' : '800px',
					title: props.element ? 'Edit Button' : 'Create Button',
					onClose: () => popPortal(),
					className: !state.type ? '' : '.pt0',
				},
				m(
					'div',
					!state.type
						? typeSelector()
						: m(Grid, { columns: '570px 230px' }, [editor(), m('div.pt2', state.element ? m(GridButton, { element: state.element }) : null)]),
				),
			),
	};
};

export function createEditGridButtonModal(props: CreateEditGridButtonProps) {
	pushPortal(createEditGridButton(props));
}
