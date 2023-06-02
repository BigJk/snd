import m from 'mithril';

export default (): m.Component => {
	return {
		view(vnode) {
			return m('div.form-group', vnode.children);
		},
	};
};
