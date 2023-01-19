export default () => {
	let getLabel = (label, col, type) => {
		if (!label) return null;
		return <label className={`form-${type ?? 'label'} ${col ? 'col-' + col : ''}`}>{label}</label>;
	};

	return {
		view(vnode) {
			if (!vnode.attrs.label || vnode.attrs.label === '') return vnode.attrs.elem;

			return (
				<div className={`form-group w-100 ${vnode.attrs.className ?? ''}`}>
					{getLabel(vnode.attrs.label, vnode.attrs.labelCol, vnode.attrs.type)}
					{vnode.attrs.elem ?? vnode.children}
				</div>
			);
		},
	};
};
