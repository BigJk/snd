import m from 'mithril';

export default () => {
	let getLabel = (label, col) => {
		if (!label) return null;
		return <label className={`form-label ${col ? 'col-' + col : ''}`}>{label}</label>;
	};

	return {
		view(vnode) {
			return (
				<div className={`form-group w-100 ${vnode.attrs.className ?? ''}`}>
					{getLabel(vnode.attrs.label, vnode.attrs.labelCol)}
					{vnode.attrs.elem}
				</div>
			);
		}
	};
};
