import m from 'mithril';

/**
 * Title component: renders a title.
 */
export default (): m.Component => {
	return {
		view(vnode) {
			return m('div.f5.b.mb3', vnode.children);
		},
	};
};
