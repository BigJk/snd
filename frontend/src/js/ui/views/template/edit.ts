import m from 'mithril';

import Template from 'js/types/template';

import * as API from 'js/core/api';

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
						items: [{ link: '/templates', label: 'Templates' }, { label: 'Edit: ' + state?.name }],
					}),
					active: 'templates',
				},
				state
					? m(TemplateEditor, {
							template: state,
							onChange: (template) => {
								state = template;
								m.redraw();
							},
					  })
					: m(Loader)
			);
		},
	};
};
