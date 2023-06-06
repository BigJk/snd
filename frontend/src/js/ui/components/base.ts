import m from 'mithril';

import SideNav from 'js/ui/components/side-nav';

type BaseProps = {
	title?: m.Children;
	active: string;
	className?: string;
};

/**
 * Base component: renders a side nav and a main content area.
 */
export default (): m.Component<BaseProps> => {
	return {
		view(vnode) {
			return m('div.w-100.h-100.flex', [
				m(SideNav, { className: '.flex-shrink-0', active: vnode.attrs.active }),
				m('div.flex-grow-1.overflow-auto' + vnode.attrs.className, [vnode.attrs.title, vnode.children]),
			]);
		},
	};
};
