import api from '/js/core/api';
import store from '/js/core/store';

import { Base, Header, TemplateEdit, Loading } from '/js/ui/components';

import { success, error } from '/js/ui/toast';

export default () => {
	let state = {
		id: null,
		template: null,
		lastRender: '',
	};

	let loadTemplate = () => {
		api.getTemplate(state.id).then((template) => {
			state.template = template;
		});
	};

	let breadcrumbs = () => {
		return [
			{
				name: 'Templates',
				link: '/templates',
			},
			{
				name: state.template?.name ?? '...',
				link: state.id ? '/templates/' + state.id : undefined,
			},
			{
				name: 'Editing',
			},
		];
	};

	let body = (vnode) => {
		if (!state.template) {
			return <Loading />;
		}

		return (
			<div className="flex-grow-1 overflow-auto">
				<TemplateEdit target={state.template} editmode={true} onrender={(r) => (state.lastRender = r)} />
			</div>
		);
	};

	return {
		oninit(vnode) {
			state.id = vnode.attrs.id;
			loadTemplate();
		},
		view(vnode) {
			if (!store.data.templates) return 'wait';

			return (
				<Base active="templates">
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()} subtitle="Edit this Template" pt={2}>
							<div className="btn btn-primary mr2" onclick={() => api.print(state.lastRender).then(() => success('Printing send'), error)}>
								Test Print
							</div>
							<div
								className="btn btn-success"
								onclick={() =>
									api.saveTemplate(state.template).then(() => {
										success('Template saved');
										store.pub('reload_templates');
										m.route.set('/templates/' + state.id);
									}, error)
								}
							>
								Save
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		},
	};
};
