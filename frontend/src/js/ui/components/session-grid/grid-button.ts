import m from 'mithril';

import { GridElement, isGridGeneratorElement, isGridTemplateElement } from 'js/types/session-grid';

import GridGeneratorButton from 'js/ui/components/session-grid/grid-generator-button';
import GridTemplateButton from 'js/ui/components/session-grid/grid-template-button';

type GridBasicButtonProps = {
	key?: string;
	element: GridElement;
};

export default (): m.Component<GridBasicButtonProps> => ({
	view: ({ attrs }) => {
		if (isGridTemplateElement(attrs.element)) {
			return m(GridTemplateButton, { key: attrs.key, element: attrs.element });
		}

		if (isGridGeneratorElement(attrs.element)) {
			return m(GridGeneratorButton, { key: attrs.key, element: attrs.element });
		}

		return m('div', { key: attrs.key }, 'Unknown element type');
	},
});
