import m from 'mithril';

// @ts-ignore
import { inElectron, shell } from 'src/js/electron';

import { intendToShoelace, sizeToShoelace } from 'js/ui/shoelace/shoelace';

import Flex from 'js/ui/components/layout/flex';

export type ButtonProps = {
	key?: string;
	onClick?: () => void;
	intend?: 'primary' | 'success' | 'error' | 'warning' | 'link';
	size?: 'sm' | 'lg';
	prefix?: m.Children;
	loading?: boolean;
	disabled?: boolean;
	className?: string;
	link?: string;
};

export default (): m.Component<ButtonProps> => {
	const openLink = (url: string | undefined) => {
		if (!url) return;

		if (url.startsWith('/')) {
			m.route.set(url);
		} else if (inElectron) {
			shell.openExternal(url);
		} else {
			window.open(url, '_blank');
		}
	};

	return {
		view({ attrs, children }) {
			const intend = intendToShoelace(attrs.intend);
			const size = sizeToShoelace(attrs.size);

			let finalChildren: m.Children = children;
			if (Array.isArray(children) && children.length > 1) {
				finalChildren = m(Flex, { items: 'center', gap: 2 }, children);
			}

			return m(
				'sl-button' + (attrs.className ?? ''),
				{
					key: attrs.key,
					variant: intend,
					size: size,
					loading: !!attrs.loading,
					onclick: attrs.link ? () => openLink(attrs.link) : !attrs.loading ? attrs.onClick : null,
					disabled: attrs.disabled,
				},
				[attrs.prefix ? m('slot', { slot: 'prefix' }, attrs.prefix) : null, finalChildren],
			);
		},
	};
};
