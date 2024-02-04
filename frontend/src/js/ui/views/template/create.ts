import m from 'mithril';

import Template, { createEmptyTemplate } from 'js/types/template';

import * as API from 'js/core/api';

import IconButton from 'js/ui/spectre/icon-button';
import TemplateEditor from 'js/ui/components/editor/template';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import { error } from 'js/ui/toast';
import { buildId } from 'js/types/basic-info';
import store from 'js/core/store';

type TemplateCreateProps = {
	id?: string;
};

export default (): m.Component<TemplateCreateProps> => {
	let state: Template = createEmptyTemplate();

	return {
		oninit({ attrs }) {
			if (attrs.id) {
				API.exec<Template>(API.GET_TEMPLATE, attrs.id)
					.then((template) => {
						state = template;
					})
					.catch(error);
			}
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [{ link: '/template', label: 'Templates' }, { label: 'Create Template' }],
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
									if (attrs.id && buildId('template', state) === attrs.id) {
										error('You cannot duplicate a template with the same slug as the original.');
										return;
									}

									API.exec<string>(API.SAVE_TEMPLATE, state)
										.then(() => {
											if (!state) return;

											if (attrs.id) {
												// If we are duplicating a generator, we need to copy the entries.
												API.exec<void>(API.COPY_ENTRIES, attrs.id, buildId('template', state))
													.then(() => {
														if (!state) return;
														m.route.set(`/template/${buildId('template', state)}`);
														store.actions.loadTemplates();
													})
													.catch(error);
											} else {
												m.route.set(`/template/${buildId('template', state)}`);
												store.actions.loadTemplates();
											}
										})
										.catch(error);
								},
							},
							'Save',
						), //
					],
					active: 'templates',
					classNameContainer: '',
				},
				m(TemplateEditor, {
					template: state,
					onChange: (template) => {
						state = template;
						m.redraw();
					},
				}),
			);
		},
	};
};
