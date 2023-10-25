import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Template from 'js/types/template';

import * as API from 'js/core/api';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

import TemplateEditor from 'js/ui/components/editor/template';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error } from 'js/ui/toast';

type EditTemplateProps = {
	id: string;
};

export default (): m.Component<EditTemplateProps> => {
	let state: Template | null = null;

	return {
		oninit({ attrs }) {
			API.exec<Template>(API.GET_TEMPLATE, attrs.id)
				.then((template) => {
					state = template;
				})
				.catch(error);
		},
		view(vnode) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: '/template', label: 'Templates' },
							{ link: `/template/${state ? buildId('template', state) : ''}`, label: state ? state.name : m(Loader, { className: '.mh2' }) },
							{ label: 'Edit' },
						],
					}),
					rightElement: [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {
									if (!state) return;
									API.exec<void>(API.SAVE_TEMPLATE, state)
										.then(() => {
											if (!state) return;
											m.route.set(`/template/${buildId('template', state)}`);
										})
										.catch(error);
								},
							},
							'Save',
						), //
					],
					active: 'templates',
				},
				state
					? m(TemplateEditor, {
							template: state,
							onChange: (template) => {
								state = template;
								m.redraw();
							},
							editMode: true,
					  })
					: m(Loader),
			);
		},
	};
};
