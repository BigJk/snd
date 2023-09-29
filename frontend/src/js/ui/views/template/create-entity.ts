import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Template from 'js/types/template';

import * as API from 'js/core/api';
import { SchemaRoot, buildSchema } from 'js/core/schema';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

type CreateTemplateEntityProps = {
	id: string;
};

type CreateTemplateEntityState = {
	template: Template | null;
	data: any;
	schema: SchemaRoot | null;
};

export default (): m.Component<CreateTemplateEntityProps> => {
	const state: CreateTemplateEntityState = {
		template: null,
		data: {},
		schema: null,
	};

	return {
		oninit({ attrs }) {
			API.exec<Template>(API.GET_TEMPLATE, attrs.id).then((template) => {
				state.template = template;
				state.schema = buildSchema(template.skeletonData);
				console.log(state.schema);
			});
		},
		view() {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: '/template', label: 'Templates' },
							{
								link: `/template/${state.template ? buildId('template', state.template) : ''}`,
								label: state.template ? state.template.name : m(Loader, { className: '.mh2' }),
							},
							{ label: 'Create Entry' },
						],
					}),
					rightElement: [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {},
							},
							'Save'
						), //
					],
					active: 'templates',
					classNameContainer: '.pa3',
				},
				m(SidebarPrintPage, {
					template: state.template,
					it: state.data,
					tabs: [{ icon: 'filing', label: 'Entry' }],
					content: {
						Entry: () => {
							return m('div', 'Entry');
						},
					},
				})
			);
		},
	};
};
