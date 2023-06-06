import m from 'mithril';

type IconProps = {
	className?: string;
	size?: number;
	icon: string;
};

/**
 * Icon component: renders an icon. Icon names can be found here: https://ionic.io/ionicons/v4
 */
export default (): m.Component<IconProps> => {
	return {
		view({ attrs }) {
			return m(`i.ion.ion-md-${attrs.icon}.f${attrs.size ?? 6}${attrs.className ?? ''}`);
		},
	};
};
