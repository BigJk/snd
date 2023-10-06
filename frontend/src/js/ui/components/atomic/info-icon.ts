import m from 'mithril';

import Tooltip from 'js/ui/components/atomic/tooltip';

type InfoIconProps = {
	className?: string;
	size?: number;
	placement?: 'top' | 'bottom' | 'left' | 'right';
};

/**
 * InfoIcon component: renders an info icon with a tooltip containing some info text.
 * This is intended to be used to show information about a particular field or section.
 */
export default (): m.Component<InfoIconProps> => ({
	view({ attrs, children }) {
		return m(
			Tooltip,
			{ content: children, placement: attrs.placement },
			m(`i.f${attrs.size ?? 6}.ion.ion-md-information-circle-outline.black-50${attrs.className ?? ''}`),
		);
	},
});
