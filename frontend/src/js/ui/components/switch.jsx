import FormGroup from '/js/ui/components/form-group';

export default () => {
	let getInput = (vnode) => (
			<label className={`form-switch ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`}>
				<input checked={vnode.attrs.value} type='checkbox' oninput={vnode.attrs.oninput} />
				<i className='form-icon' />
			</label>
		);

	return {
		view(vnode) {
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getInput(vnode)} />;
		},
	};
};
