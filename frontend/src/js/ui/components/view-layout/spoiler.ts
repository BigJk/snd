import m from 'mithril';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

type SpoilerProps = {
	title: m.Component;
	className?: string;
	initialOpen?: boolean;
	key?: string;
};

export default (): m.Component<SpoilerProps> => {
	let open = false;

	return {
		oninit({ attrs }) {
			open = attrs.initialOpen ?? false;
		},
		view({ attrs, children }) {
			return m(`div.ba.b--black-10.bg-white.br2${attrs.className ?? ''}`, [
				m(
					Flex,
					{
						className: `.pointer.pa2${open ? '.bb.b--black-10' : ''}`,
						justify: 'between',
						items: 'center',
						onclick: () => {
							open = !open;
						},
					},
					[
						m('div', { key: attrs.key }, attrs.title), //
						m(Icon, { key: attrs.key, icon: open ? 'arrow-dropup' : 'arrow-dropdown', size: 5 }),
					],
				),
				open ? m('div', children) : null,
			]);
		},
	};
};
