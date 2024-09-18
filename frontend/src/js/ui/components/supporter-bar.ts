import m from 'mithril';

import Icon from './atomic/icon';
import Flex from './layout/flex';

let supporter: string[] = ['loading'];

m.request({
	url: '/proxy/https://raw.githubusercontent.com/BigJk/snd-package-repo/refs/heads/v2/supporter.json',
}).then((res) => {
	supporter = res as string[];
});

export default (): m.Component => ({
	view(vnode) {
		return m(Flex, { className: '.mb3' }, [
			m(Flex, { className: '.bg-primary.ph3.white.br3.br--left', items: 'center', justify: 'center' }, m(Icon, { icon: 'mail' })),
			m(
				'div.grid-bg.pv2.white.f8.overflow-hidden.flex-grow-1',
				m('span.scroll-text', [
					m('span.col-error.mr1', '♥'),
					m('span.b.mr3.ttu', 'Thanks to all supporters and contributors!'), //
					m('span.mr3', supporter.join(', ') + '...'),
					m('span.o-70', ' and everyone else that checked the project out!'),
				]),
			),
			m('div.bg-primary.br3.br--right.w1'),
		]);
	},
});
