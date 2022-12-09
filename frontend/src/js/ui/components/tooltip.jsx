import Tippy from 'tippy.js';

export default () => ({
		oncreate: function (vnode) {
			Tippy(vnode.dom, {
				maxWidth: 220,
				content: vnode.attrs.content,
			});
		},
		view: function (vnode) {
			return vnode.children;
		},
	});
