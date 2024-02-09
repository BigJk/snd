import m from 'mithril';

import IconButton from 'js/ui/spectre/icon-button';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

type PageEmptyStateProps = {
	name: string;
	bigMessage?: boolean;
};

export default (): m.Component<PageEmptyStateProps> => ({
	view({ attrs }) {
		let message: any = 'Try searching for something else...';
		if (attrs.bigMessage) {
			message = m(
				Flex,
				{ gap: 3, direction: 'column' },
				m(Icon, { icon: 'sad', size: 1, className: '.o-50' }),
				`There are no ${attrs.name} yet. Check the workshop if you want to download community ${attrs.name} to get started!`,
				m(
					'div',
					m(
						IconButton,
						{ intend: 'primary', icon: 'cart', className: '.mh2', link: '/workshop/T2ZmaWNpYWwgUGFja2FnZSBSZXBv', size: 'sm' },
						'Workshop',
					),
				),
			);
		}

		return m('div.bg-white.br2.ba.b--black-10.pa3', [
			m('div.f8.fw5.ttu.mb3.text-muted', `No ${attrs.name} found`), //
			m('div.f7.tc', message),
		]);
	},
});
