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
				render(tmpl.printTemplate, { it: state.json, images: tmpl.images })
					.then((res) => {
						state.tmpl = res;
					})
					.catch((err) => {
						state.tmpl = 'Template Error';
					});
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
