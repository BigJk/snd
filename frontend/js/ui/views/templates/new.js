import m from 'mithril';

import api from '../../../core/api';
import store from '../../../core/store';

import Base from '../../components/base';
import Header from '../../components/header';
import TemplateEdit from '../../components/template-edit';
import Loading from '../../components/loading';

import { success, error } from '../../toast';
import { newTemplate } from '../../../core/factory';

export default () => {
	let state = {
		template: newTemplate()
	};

	let breadcrumbs = () => {
		return [
			{
				name: 'Templates',
				link: '/templates'
			},
			{
				name: 'New'
			}
		];
	};

	let body = () => {
		if (!store.data.templates) return <Loading />;

		return (
			<div className="flex-grow-1 overflow-auto">
				<TemplateEdit target={state.template} />
			</div>
		);
	};

	return {
		view(vnode) {
			return (
				<Base active="templates">
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()} subtitle="Create a new Template">
							<div
								className="btn btn-success"
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
		}
	};
};
