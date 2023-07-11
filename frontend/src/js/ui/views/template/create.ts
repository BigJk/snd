import m from 'mithril';

import Template, { createEmptyTemplate } from 'js/types/template';

import IconButton from 'js/ui/spectre/icon-button';

import TemplateEditor from 'js/ui/components/editor/template';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

export default (): m.Component => {
	let state: Template = createEmptyTemplate();

	return {
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
						m(IconButton, { icon: 'add', size: 'sm', intend: 'success' }, 'Save'), //
					],
					active: 'templates',
					classNameContainer: '',
				},
				m(TemplateEditor, {
					template: state,
					onChange: (template) => {
						state = template;
					},
				})
			);
		},
	};
};
