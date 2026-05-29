import m from 'mithril';

import Template from 'js/types/template';
import * as API from 'js/core/api';

import TemplateEditor from 'js/ui/components/editor/template';

import EntityEdit from 'js/ui/views/shared/entity-edit';

export default (): m.Component<{ id: string }> => {
	let hadJSONError = false;

	return EntityEdit<Template>({
		kind: 'template',
		listLabel: 'Templates',
		listRoute: '/template',
		active: 'templates',
		fetchEntity: (id) => API.exec<Template>(API.GET_TEMPLATE, id),
		saveEntity: (entity) => API.exec<void>(API.SAVE_TEMPLATE, entity),
		validate: () => (hadJSONError ? 'Errors in the "Data Skeleton", please fix them before saving.' : null),
		renderEditor: (entity, onChange, onRendered) =>
			m(TemplateEditor, {
				template: entity,
				onChange,
				onRendered,
				onJSONError: (err) => {
					hadJSONError = !!err;
				},
				editMode: true,
			}),
	});
};
