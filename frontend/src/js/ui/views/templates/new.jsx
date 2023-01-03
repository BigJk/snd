import api from '/js/core/api';
import { NewTemplate } from '/js/core/factory';
import { templateId, validBaseInformation } from '/js/core/model-helper';
import store from '/js/core/store';
import { templateById } from '/js/core/store-helper';

import { Base, Header, TemplateEdit } from '/js/ui/components';

import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		template: NewTemplate(),
	};

	let breadcrumbs = () => [
		{
			name: 'Templates',
			link: '/templates',
		},
		{
			name: 'New',
		},
	];

	let body = () => (
		<div className='flex-grow-1 overflow-auto'>
			<TemplateEdit target={state.template} />
		</div>
	);

	return {
		oninit(vnode) {
			if (vnode.attrs.id) {
				let dupeTemplate = templateById(vnode.attrs.id);
				if (dupeTemplate) {
					state.template = dupeTemplate;
					state.template.name += ' Copy';
					state.template.slug += '-copy';
				}
			}
		},
		view(vnode) {
			return (
				<Base active='templates'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} subtitle='Create a new Template' pt={2}>
							<div
								className='btn btn-success'
								onclick={() => {
									let { valid, reason } = validBaseInformation(state.template);

									if (!valid) {
										error(reason);
										return;
									}

									if (templateById(vnode.attrs.id)) {
										error('This template already exists');
										return;
									}

									api
										.saveTemplate(state.template)
										.then(() => {
											// if this is a duplication we want to copy the entries from the original to the duplicated.
											if (vnode.attrs.id) {
												return api.copyEntries(vnode.attrs.id, templateId(state.template));
											}
										})
										.then(() => {
											success('Template saved');
											store.pub('reload_templates');
											m.route.set('/templates');
										})
										.catch(error);
								}}
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
