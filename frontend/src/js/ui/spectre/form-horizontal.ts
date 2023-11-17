import m from 'mithril';

export default (): m.Component => ({
	view(vnode) {
		return m('div.form-horizontal', vnode.children);
	},
});
