import m from 'mithril';

import { GridPrinterCommandElement } from 'js/types/session-grid';
import { executeElement } from 'js/core/session-grid';

import Icon from 'js/ui/components/atomic/icon';

type GridPrinterCommandButtonProps = {
	key?: string;
	element: GridPrinterCommandElement;
};

const COMMAND_NAMES: Record<string, string> = {
	cut: 'Cut Paper',
	drawer1: 'Drawer 1',
	drawer2: 'Drawer 2',
};

const COMMAND_ICONS: Record<string, string> = {
	cut: 'scissors',
	drawer1: 'box',
	drawer2: 'box',
};

export default (): m.Component<GridPrinterCommandButtonProps> => {
	return {
		view: ({ attrs }) => {
			const name = attrs.element.name || COMMAND_NAMES[attrs.element.command] || 'Command';
			const icon = COMMAND_ICONS[attrs.element.command] || 'terminal';

			return m('div.flex.items-center.justify-center', { key: attrs.key, style: { aspectRatio: '1 / 1', padding: 0 } }, [
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
							name,
						),
						m(
							'div.flex-grow-1.br3.br--bottom.flex.justify-center.items-center',
							{ key: attrs.key, style: { backgroundColor: attrs.element.color } },
							[m(Icon, { key: attrs.key, icon: icon, size: 3, className: '.white.mb3' })],
						),
					],
				),
			]);
		},
	};
};
