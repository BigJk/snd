import m from 'mithril';

import { intendToShoelace } from 'js/ui/shoelace/shoelace';

export type LabelProps = {
	className?: string;
	intend?: 'primary' | 'success' | 'warning' | 'error';
	removable?: boolean;
	onRemove?(): void;
};

export default (): m.Component<LabelProps> => ({
	view: ({ attrs, children }) =>
		m(
			`sl-tag[size=small]${attrs.intend ? `[variant=${intendToShoelace(attrs.intend)}]` : ''}${
				attrs.removable || attrs.onRemove ? '[removable]' : ''
			}${attrs.className ?? ''}`,
			{ 'onsl-remove': attrs.onRemove },
			children,
		),
});
