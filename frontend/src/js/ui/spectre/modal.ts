import m from 'mithril';

import Loader from 'js/ui/spectre/loader';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

export type ModalProps = {
	title: string;
	icon?: string;
	onClose?: () => void;
	width?: number;
	loading?: boolean;
	loadingMessage?: string;
};

export default (): m.Component<ModalProps> => ({
	view({ children, attrs }) {
		return m(
			'div.bg-white.ba.b--black-10.br2',
			{ style: { width: attrs.width ? attrs.width + 'px' : '600px', 'box-shadow': 'rgba(149, 157, 165, 0.35) 0px 8px 24px' } },
			[
				m(Flex, { className: '.pv2.ph3.f6.b.bg-black-05.br2.br--top', justify: 'between' }, [
					m(Flex, { items: 'center', gap: 2 }, [attrs.icon ? m(Icon, { icon: attrs.icon }) : null, attrs.title]),
					!attrs.loading ? m(Icon, { icon: 'close', onClick: attrs.onClose }) : null,
				]),
				m('div.pa3.relative', [
					attrs.loading
						? m(Flex, { className: '.bg-white-80.absolute.left-0.top-0.w-100.h-100.z-5', justify: 'center', items: 'center', direction: 'column' }, [
								m(Loader),
								attrs.loadingMessage ? m('div.f8.text-muted.mt2', attrs.loadingMessage) : null,
						  ])
						: null,
					children,
				]),
			],
		);
	},
});
