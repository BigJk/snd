import m from 'mithril';

import FormGroup from './form-group';
import FormHorizontal from './form-horizontal';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(FormHorizontal, m(FormGroup, vnode.children));
		},
	};
};
