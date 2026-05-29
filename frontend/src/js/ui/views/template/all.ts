import Template from 'js/types/template';
import * as API from 'js/core/api';
import store, { templates } from 'js/core/store';

import EntityList from 'js/ui/views/shared/entity-list';

export default () =>
	EntityList<Template>({
		title: 'Templates',
		kind: 'template',
		searchLabel: 'templates',
		countLabel: 'templates',
		active: 'templates',
		importEndpoint: API.IMPORT_TEMPLATE,
		importTitle: 'Import Template',
		createRoute: '/template/create',
		itemsAtom: templates,
		loadAction: store.actions.loadTemplates,
	});
