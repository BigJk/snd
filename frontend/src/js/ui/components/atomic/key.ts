import m from 'mithril';

import Flex from 'js/ui/components/layout/flex';

type KeyProps = {
	className?: string;
	key: m.Children;
};

export default (): m.Component<KeyProps> => ({
	view(vnode) {
		return m(Flex, { items: 'center', className: vnode.attrs.className }, [
			m('div.pa1.bg-primary.br2.mr2.white', vnode.attrs.key), //
			m('div.text-muted.fw5', vnode.children),
		]);
	},
});
