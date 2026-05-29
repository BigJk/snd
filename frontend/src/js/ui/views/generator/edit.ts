import m from 'mithril';

import { filterOutDynamicConfigValues } from 'js/types/config';
import Generator from 'js/types/generator';
import * as API from 'js/core/api';

import GeneratorEditor from 'js/ui/components/editor/generator';

import EntityEdit from 'js/ui/views/shared/entity-edit';

export default () =>
	EntityEdit<Generator>({
		kind: 'generator',
		listLabel: 'Generators',
		listRoute: '/generator',
		active: 'generators',
		fetchEntity: (id) => API.exec<Generator>(API.GET_GENERATOR, id),
		saveEntity: (entity) =>
			API.exec<void>(API.SAVE_GENERATOR, {
				...entity,
				config: filterOutDynamicConfigValues(entity.config),
			}),
		renderEditor: (entity, onChange, onRendered) =>
			m(GeneratorEditor, {
				generator: entity,
				onChange,
				onRendered,
				editMode: true,
			}),
	});
