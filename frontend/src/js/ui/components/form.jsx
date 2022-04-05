export default () => {
	return {
		view(vnode) {
			return <div className={`${vnode.attrs.className} ${vnode.attrs.horizontal ? 'form-horizontal' : ''}`}>{vnode.children}</div>;
		},
	};
};
