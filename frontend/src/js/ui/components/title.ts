import m from 'mithril';

export default (): m.Component => {
	return {
		view(vnode) {
			return m('div.f5.b.mb3', vnode.children);
		},
	};
};
