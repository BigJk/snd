import m from 'mithril';
import { cloneDeep, isEqual } from 'lodash-es';

import { GridElement } from 'js/types/session-grid';
import { executeElement, getGridElementName } from 'js/core/session-grid';

import Icon from 'js/ui/components/atomic/icon';

type GridBasicButtonProps = {
	key?: string;
	element: GridElement;
};

type GridBasicButtonState = {
	lastState?: GridElement;
	name: string;
};

export default (): m.Component<GridBasicButtonProps> => {
	let state: GridBasicButtonState = {
		name: '',
	};

	const fetchName = (element: GridElement) => {
		getGridElementName(element).then((res) => {
			state.name = res;
			m.redraw();
		});
	};

	return {
		oninit: ({ attrs }) => {
			fetchName(attrs.element);
			state.lastState = cloneDeep(attrs.element);
		},
		onupdate({ attrs }) {
			if (!isEqual(attrs.element, state.lastState)) {
				fetchName(attrs.element);
				state.lastState = cloneDeep(attrs.element);
			}
		},
		view: ({ attrs }) =>
			m('div.flex.items-center.justify-center', { key: attrs.key, style: { aspectRatio: '1 / 1', padding: 0 } }, [
				m(
					'div.bg-primary.flex.flex-column.br3.pointer.grow',
					{
						key: attrs.key,
						style: { height: '90%', width: '95%' },
						onclick: () => {
							executeElement(attrs.element);
						},
					},
					[
						m(
							'div.f8.tc.pa2.white.b.ttu.truncate.w-100.mw-100.flex-grow-0.flex-shrink-0.br3.br--top',
							{ key: attrs.key, style: { backgroundColor: attrs.element.color } },
							state.name,
						), //
						m(
							'div.flex-grow-1.br3.br--bottom.flex.justify-center.items-center',
							{ key: attrs.key, style: { backgroundColor: attrs.element.color } },
							[m(Icon, { key: attrs.key, icon: 'play', size: 3, className: '.white.mb3' })],
						),
					],
				),
			]),
	};
};
