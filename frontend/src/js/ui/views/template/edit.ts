import m from 'mithril';

import Template from 'js/types/template';

import * as API from 'js/core/api';

import Loader from 'js/ui/spectre/loader';

import Title from 'js/ui/components/atomic/title';
import TemplateEditor from 'js/ui/components/editor/template';
import Base from 'js/ui/components/view-layout/base';

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
				{ title: m(Title, 'Edit Template'), active: 'templates' },
				state
					? m(TemplateEditor, {
							template: state,
							onChange: (template) => {
								state = template;
							},
					  })
					: m(Loader)
			);
		},
	};
};
