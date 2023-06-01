import m from 'mithril';

import Tippy from 'tippy.js';

type TooltipProps = {
	content: string;
	placement?: 'top' | 'bottom' | 'left' | 'right';
};

export default (): m.Component<TooltipProps> => ({
	oncreate: function (vnode) {
		Tippy(vnode.dom, {
			maxWidth: 220,
			content: vnode.attrs.content,
			placement: vnode.attrs.placement ?? 'top',
		});
	},
	view: function (vnode) {
		return vnode.children;
	},
});
