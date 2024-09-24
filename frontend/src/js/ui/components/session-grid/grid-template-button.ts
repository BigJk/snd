import m from 'mithril';
import { cloneDeep, debounce, isEqual } from 'lodash-es';

import { GridTemplateElement } from 'js/types/session-grid';
import { executeElement, getGridElementName, getGridTemplateChoices } from 'js/core/session-grid';

import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';
import Select from 'js/ui/shoelace/select';

import GridBasicButton from 'js/ui/components/session-grid/grid-basic-button';

type GridTemplateButtonProps = {
	key?: string;
	element: GridTemplateElement;
};

type GridTemplateButtonState = {
	lastState?: GridTemplateElement;
	name: string;
	search: string;
	selected: string;
	choices: {
		id: string;
		name: string;
		source?: string;
	}[];
};

export default (): m.Component<GridTemplateButtonProps> => {
	let state: GridTemplateButtonState = {
		name: '',
		search: '',
		selected: '',
		choices: [],
	};

	const fetchChoices = debounce((element: GridTemplateElement) => {
		getGridTemplateChoices(element, state.search).then((res) => {
			state.choices = res;

			if (state.choices.length === 1) {
				state.selected = state.choices[0].id;
			} else {
				const selected = state.choices.find((choice) => choice.name.toLowerCase() === state.search.toLowerCase());
				if (selected) {
					state.selected = selected.id;
				}
			}

			m.redraw();
		});
	}, 250);

	const fetchAll = (element: GridTemplateElement) => {
		getGridElementName(element).then((res) => {
			state.name = res;
			m.redraw();
		});
		fetchChoices(element);
	};

	const execute = (base: GridTemplateElement) => {
		if (state.selected.length === 0) {
			return;
		}
		executeElement({
			...base,
			entryId: state.selected,
			dataSourceId: state.choices.find((c) => c.id === state.selected)?.source,
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
			if (attrs.element.entryId) {
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
						m(Input, {
							key: attrs.key,
							placeholder: 'Search entry...',
							value: state.search,
							onChange: (val) => {
								state.search = val;
								fetchChoices(attrs.element);
							},
							onEnter: () => execute(attrs.element),
						}), //
						m(Select, {
							key: attrs.key,
							keys: state.choices.map((c) => c.id),
							names: state.choices.map((c) => c.name),
							selected: state.selected,
							onInput: (e) => (state.selected = e.target.value),
						}), //
						m(IconButton, { key: attrs.key, icon: 'print', intend: 'primary', onClick: () => execute(attrs.element) }, 'Print'),
					]),
				]),
			]);
		},
	};
};
