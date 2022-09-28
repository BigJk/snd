import rpc from '/js/core/api';
import { render } from '/js/core/templating';

export default () => {
	let state = {
		id: null,
		json: null,
		tmpl: null,
	};

	return {
		oninit(vnode) {
			state.id = vnode.attrs.id;
			state.json = JSON.parse(atob(vnode.attrs.json));

			rpc.getTemplate(state.id).then((tmpl) => {
				state.tmpl = render(tmpl.printTemplate, { it: state.json, images: tmpl.images });
			});
		},
		onremove() {},
		view(vnode) {
			if (state.tmpl === null) {
				return <div></div>;
			}

			return <div>{m.trust(state.tmpl)}</div>;
		},
	};
};
