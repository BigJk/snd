import m from 'mithril';
import { cloneDeep, isEqual } from 'lodash-es';

import { GridGeneratorElement } from 'js/types/session-grid';
import { executeElement, getGridElementName, getGridGeneratorConfigChoices } from 'js/core/session-grid';

import IconButton from 'js/ui/shoelace/icon-button';
import Select from 'js/ui/shoelace/select';

import GridBasicButton from 'js/ui/components/session-grid/grid-basic-button';

type GridGeneratorButtonProps = {
	key?: string;
	element: GridGeneratorElement;
};

type GridGeneratorButtonState = {
	lastState?: GridGeneratorElement;
	name: string;
	selected: string;
	choices: string[];
};

export default (): m.Component<GridGeneratorButtonProps> => {
	let state: GridGeneratorButtonState = {
		name: '',
		selected: '',
		choices: [],
	};

	const fetchChoices = (element: GridGeneratorElement) => {
		getGridGeneratorConfigChoices(element)
			.then((res) => {
				state.choices = res;
			})
			.catch(() => {
				state.choices = [];
			});
	};

	const fetchAll = (element: GridGeneratorElement) => {
		getGridElementName(element).then((res) => {
			state.name = res;
		});
		fetchChoices(element);
	};

	const execute = (base: GridGeneratorElement) => {
		executeElement({
			...base,
			configName: state.selected,
		});
	};

	return {
		oninit: ({ attrs }) => {
			fetchAll(attrs.element);
			state.lastState = cloneDeep(attrs.element);
		},
		onupdate({ attrs }) {
			if (!isEqual(state.lastState, attrs.element)) {
				fetchAll(attrs.element);
				state.lastState = cloneDeep(attrs.element);
			}
		},
		view: ({ attrs }) => {
			if (state.choices.length === 0 || (attrs.element.configName?.length ?? 0) > 0) {
				return m(GridBasicButton, { element: attrs.element });
			}

			return m('div.flex.items-center.justify-center', { key: attrs.key, style: { aspectRatio: '1 / 1', padding: 0 } }, [
				m('div.bg-black-05.flex.flex-column.br3', { key: attrs.key, style: { height: '90%', width: '95%' } }, [
					m(
						'div.f8.tc.pa2.bg-primary.white.b.ttu.truncate.w-100.mw-100.flex-grow-0.flex-shrink-0.br3.br--top',
						{ key: attrs.key, style: { backgroundColor: attrs.element.color } },
						state.name,
					), //
					m('div.ba.b--black-05.flex-grow-1.br3.br--bottom.pa2.flex.flex-column.gap-2.justify-between', [
						m(Select, {
							key: attrs.key,
							keys: state.choices,
							selected: state.selected,
							clearable: true,
							onInput: (e) => (state.selected = e.target.value),
						}), //
						m(IconButton, { key: attrs.key, icon: 'print', intend: 'primary', onClick: () => execute(attrs.element) }, 'Print'),
					]),
				]),
			]);
		},
	};
};
