import m from 'mithril';

// @ts-ignore
import { shell } from 'src/js/electron';

import Flex from 'js/ui/components/layout/flex';

export type ButtonProps = {
	onClick?: () => void;
	intend?: 'primary' | 'success' | 'error' | 'warning' | 'link';
	size?: 'sm' | 'lg';
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
		} else {
			shell.openExternal(url);
		}
	};

	return {
		view({ attrs, children }) {
			let classes = '.btn';
			if (attrs.intend) {
				classes += '.btn-' + attrs.intend;
			}
			if (attrs.size) {
				classes += '.btn-' + attrs.size;
			}
			if (attrs.loading) {
				classes += '.loading';
			}
			if (attrs.disabled) {
				classes += '.disabled';
			}

			let finalChildren: m.Children = children;
			if (Array.isArray(children)) {
				finalChildren = m(Flex, { items: 'center', gap: 2 }, children);
			}

			return m('button' + classes + (attrs.className ?? ''), { onclick: attrs.link ? () => openLink(attrs.link) : attrs.onClick }, finalChildren);
		},
	};
};
