import m from 'mithril';

import FormGroup from './form-group';

export default () => {
	let getInput = vnode => {
		return (
			<label className={`form-switch ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`}>
				<input checked={vnode.attrs.value} type="checkbox" oninput={vnode.attrs.oninput} />
				<i className="form-icon" />
			</label>
		);
	};

	return {
		view(vnode) {
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getInput(vnode)} />;
		}
	};
};
