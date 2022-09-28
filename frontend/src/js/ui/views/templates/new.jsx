import api from '/js/core/api';
import { NewTemplate } from '/js/core/factory';
import store from '/js/core/store';

import { Base, Header, TemplateEdit } from '/js/ui/components';

import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		template: NewTemplate(),
	};

	let breadcrumbs = () => {
		return [
			{
				name: 'Templates',
				link: '/templates',
			},
			{
				name: 'New',
			},
		];
	};

	let body = () => {
		return (
			<div className='flex-grow-1 overflow-auto'>
				<TemplateEdit target={state.template} />
			</div>
		);
	};

	return {
		view(vnode) {
			return (
				<Base active='templates'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} subtitle='Create a new Template' pt={2}>
							<div
								className='btn btn-success'
								onclick={() => {
									if (state.template.name.length === 0) {
										error('Please insert a name');
										return;
									}

									api.saveTemplate(state.template).then(() => {
										success('Template saved');
										store.pub('reload_templates');
										m.route.set('/templates');
									}, error);
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
