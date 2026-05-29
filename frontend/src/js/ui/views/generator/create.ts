import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import { filterOutDynamicConfigValues } from 'js/types/config';
import Generator, { createEmptyGenerator } from 'js/types/generator';
import * as API from 'js/core/api';
import store from 'js/core/store';

import GeneratorEditor from 'js/ui/components/editor/generator';

import EntityCreate from 'js/ui/views/shared/entity-create';

export default () =>
	EntityCreate<Generator>({
		kind: 'generator',
		listLabel: 'Generators',
		listRoute: '/generator',
		active: 'generators',
		createEmpty: createEmptyGenerator,
		fetchEntity: (id) => API.exec<Generator>(API.GET_GENERATOR, id),
		saveEntity: (entity) =>
			API.exec<void>(API.SAVE_GENERATOR, {
				...entity,
				config: filterOutDynamicConfigValues(entity.config),
			}).then(() => {
				store.actions.loadGenerators();
			}),
		copyEntries: (fromId, toId) => API.exec<void>(API.COPY_ENTRIES, fromId, toId),
		validate: (entity, isDuplicate, sourceId) => {
			if (isDuplicate && sourceId && buildId('generator', entity) === sourceId)
				return 'You cannot duplicate a generator with the same slug as the original.';
			return null;
		},
		renderEditor: (entity, onChange) =>
			m(GeneratorEditor, {
				generator: entity,
				onChange,
				editMode: false,
			}),
	});
