import FormGroup from '/js/ui/components/form-group';

export default () => {
	let getInput = (vnode) => {
		return (
			<input
				value={vnode.attrs.value}
				className={`form-input ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`}
				type={vnode.attrs.type ?? 'text'}
				placeholder={vnode.attrs.placeholder}
				oninput={vnode.attrs.oninput}
				disabled={vnode.attrs.disabled}
			/>
		);
	};

	return {
		view(vnode) {
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getInput(vnode)} />;
		},
	};
};
