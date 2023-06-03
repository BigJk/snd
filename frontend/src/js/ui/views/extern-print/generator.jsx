import api from '/js/core/api';
import { render } from '/js/core/generator';

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

			api
				.getEntriesWithSources(state.id)
				.then((entries) => {
					api.getGenerator(state.id).then((gen) => {
						render(gen, entries ?? [], state.json)
							.then((res) => {
								state.gen = res;
							})
							.catch((err) => {
								state.gen = 'Generator Error: ' + err;
							})
							.finally(m.redraw);
					});
				})
				.catch((err) => {
					state.gen = 'Generator Error: ' + err;
					m.redraw();
				});
		},
		view(vnode) {
			if (state.gen === null) {
				return <div />;
			}

			return <div id='render-done'>{m.trust(state.gen)}</div>;
		},
	};
};
