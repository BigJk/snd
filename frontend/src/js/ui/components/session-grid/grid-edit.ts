import m from 'mithril';

import { GridElement } from 'js/types/session-grid';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';
import GridButton from 'js/ui/components/session-grid/grid-button';

type GridBasicButtonProps = {
	key?: string;
	element: GridElement;
	inEdit?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	onMoveLeft?: () => void;
	onMoveRight?: () => void;
};

export default (): m.Component<GridBasicButtonProps> => ({
	view: ({ attrs }) => {
		if (attrs.inEdit) {
			return m(Flex, { direction: 'column' }, [
				m(GridButton, { element: attrs.element, key: attrs.key }), //
				m(Flex, { gap: 3, className: '.ml3' }, [
					m(Icon, { icon: 'arrow-round-back', className: '.col-dark', onClick: attrs.onMoveLeft }), //
					m(Icon, { icon: 'arrow-round-forward', className: '.col-dark', onClick: attrs.onMoveRight }),
					m(Icon, { icon: 'create', className: '.col-dark', onClick: attrs.onEdit }),
					m(Icon, { icon: 'trash', className: '.col-error', onClick: attrs.onDelete }),
				]),
			]);
		}

		return m(GridButton, { element: attrs.element, key: attrs.key });
	},
});
