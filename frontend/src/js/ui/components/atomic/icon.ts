import m from 'mithril';

type IconProps = {
	className?: string;
	size?: number;
	icon: string;
	onClick?: () => void;
	key?: string;
};

/**
 * Icon component: renders an icon. Icon names can be found here: https://ionic.io/ionicons/v4
 */
export default (): m.Component<IconProps> => ({
	view({ attrs }) {
		return m(`i.ion.ion-md-${attrs.icon}.f${attrs.size ?? 6}${attrs.onClick ? '.pointer.dim' : ''}${attrs.className ?? ''}`, {
			key: attrs.key,
			onclick: () => {
				if (!attrs.onClick) return;
				attrs.onClick();
			},
		});
	},
});
