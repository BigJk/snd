import m from 'mithril';

import FormGroup from './form-group';

export default () => {
	let getTextarea = vnode => {
		return <textarea value={vnode.attrs.value} cols={vnode.attrs.cols} className={`form-input ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`} placeholder={vnode.attrs.placeholder} oninput={vnode.attrs.oninput} />;
	};

	return {
		view(vnode) {
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getTextarea(vnode)} />;
		}
	};
};
