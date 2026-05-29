import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Template, { createEmptyTemplate } from 'js/types/template';
import * as API from 'js/core/api';
import store from 'js/core/store';

import TemplateEditor from 'js/ui/components/editor/template';

import EntityCreate from 'js/ui/views/shared/entity-create';

export default (): m.Component<{ id?: string }> => {
	let hadJSONError = false;

	return EntityCreate<Template>({
		kind: 'template',
		listLabel: 'Templates',
		listRoute: '/template',
		active: 'templates',
		showDevTools: true,
		createEmpty: createEmptyTemplate,
		fetchEntity: (id) => API.exec<Template>(API.GET_TEMPLATE, id),
		saveEntity: (entity) =>
			API.exec<string>(API.SAVE_TEMPLATE, entity).then(() => {
				store.actions.loadTemplates();
			}),
		copyEntries: (fromId, toId) => API.exec<void>(API.COPY_ENTRIES, fromId, toId),
		validate: (entity, isDuplicate, sourceId) => {
			if (hadJSONError) return 'Errors in the "Data Skeleton", please fix them before saving.';
			if (isDuplicate && sourceId && buildId('template', entity) === sourceId)
				return 'You cannot duplicate a template with the same slug as the original.';
			return null;
		},
		renderEditor: (entity, onChange) =>
			m(TemplateEditor, {
				template: entity,
				onChange,
				onJSONError: (err) => {
					hadJSONError = !!err;
				},
			}),
	});
};
