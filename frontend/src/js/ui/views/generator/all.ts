import Generator from 'js/types/generator';
import * as API from 'js/core/api';
import store, { generators } from 'js/core/store';

import EntityList from 'js/ui/views/shared/entity-list';

export default () =>
	EntityList<Generator>({
		title: 'Generators',
		kind: 'generator',
		searchLabel: 'generators',
		countLabel: 'generators',
		hoverText: 'Hover over a generator to preview',
		active: 'generators',
		importEndpoint: API.IMPORT_GENERATOR,
		importTitle: 'Import Generator',
		createRoute: '/generator/create',
		itemsAtom: generators,
		loadAction: store.actions.loadGenerators,
	});
