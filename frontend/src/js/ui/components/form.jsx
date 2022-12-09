export default () => ({
		view(vnode) {
			return <div className={`${vnode.attrs.className} ${vnode.attrs.horizontal ? 'form-horizontal' : ''}`}>{vnode.children}</div>;
		},
	});
