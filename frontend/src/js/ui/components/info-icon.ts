import m from 'mithril';

import Tooltip from 'js/ui/components/tooltip';

type InfoIconProps = {
	classNames?: string;
	size?: number;
	placement?: 'top' | 'bottom' | 'left' | 'right';
};

export default (): m.Component<InfoIconProps> => {
	return {
		view({ attrs, children }) {
			return m(Tooltip, { content: children, placement: attrs.placement }, m(`i.f${attrs.size ?? 5}.ion.ion-md-information-circle-outline`));
		},
	};
};
