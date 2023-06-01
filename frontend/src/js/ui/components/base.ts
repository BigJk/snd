import m from 'mithril';

import SideNav from 'js/ui/components/side-nav';

type BaseProps = {
	active: string;
	classNames?: string;
};

export default (): m.Component<BaseProps> => {
	return {
		view(vnode) {
			return m('div.w-100.h-100.flex', [
				m(SideNav, { classNames: '.flex-shrink-0', active: vnode.attrs.active }),
				m('div.flex-grow-1' + vnode.attrs.classNames, vnode.children),
			]);
		},
	};
};
