import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Template from 'js/types/template';
import * as API from 'js/core/api';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Loader from 'js/ui/shoelace/loader';

import Tooltip from 'js/ui/components/atomic/tooltip';
import TemplateEditor from 'js/ui/components/editor/template';
import Flex from 'js/ui/components/layout/flex';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error, success } from 'js/ui/toast';

type EditTemplateProps = {
	id: string;
};

export default (): m.Component<EditTemplateProps> => {
	let state: Template | null = null;
	let hadJSONError = false;
	let lastRenderedHTML = '';

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
					rightElement: m(Flex, { items: 'center' }, [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {
									if (hadJSONError) {
										error('Errors in the "Data Skeleton", please fix them before saving.');
										return;
									}

									if (!state || hadJSONError) return;
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
						m(DividerVert),
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(IconButton, {
								className: '.mr2',
								intend: 'primary',
								icon: 'bug',
								size: 'sm',
								onClick: () => {
									openDevTools(document.body);
								},
							}),
						),
						m(
							Tooltip,
							{ content: 'Test Print' },
							m(IconButton, {
								intend: 'primary',
								icon: 'print',
								size: 'sm',
								onClick: () => {
									API.exec(API.PRINT, lastRenderedHTML)
										.then(() => success('Test print sent!'))
										.catch(error);
								},
							}),
						),
					]),
					active: 'templates',
				},
				state
					? m(TemplateEditor, {
							template: state,
							onChange: (template) => {
								state = template;
								m.redraw();
							},
							onJSONError: (error) => {
								hadJSONError = !!error;
							},
							onRendered: (html) => {
								lastRenderedHTML = html;
							},
							editMode: true,
						})
					: m(Loader),
			);
		},
	};
};
