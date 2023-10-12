import m from 'mithril';
import Flex from 'js/ui/components/layout/flex';
import Icon from 'js/ui/components/atomic/icon';

type SpoilerProps = {
	title: m.Component;
	className?: string;
	initialOpen?: boolean;
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
						m('div', attrs.title), //
						m(Icon, { icon: open ? 'arrow-dropup' : 'arrow-dropdown', size: 5 }),
					],
				),
				open ? m('div.pa2', children) : null,
			]);
		},
	};
};
