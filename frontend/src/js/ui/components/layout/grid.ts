import m from 'mithril';

type GridProps = {
	key?: string;
	className?: string;
	minWidth?: string;
	maxWidth?: string;
	gap?: number;
	columns?: string;
	justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
	alignItems?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
};

/**
 * Grid component: renders a grid.
 */
export default (): m.Component<GridProps> => ({
	view({ attrs, children }) {
		let min = attrs.minWidth ?? '400px';
		let max = attrs.maxWidth ?? '1fr';

		let style = {
			display: 'grid',
			gridTemplateColumns: attrs.columns ?? `repeat(auto-fit, minmax(${min}, ${max}))`,
			justifyContent: attrs.justifyContent ?? undefined,
			alignItems: attrs.alignItems ?? undefined,
		};

		return m(
			`div${attrs.className ?? ''}${attrs.gap ? `.gap-${attrs.gap}` : '.gap-3'}`,
			{
				key: attrs.key,
				style,
			},
			children,
		);
	},
});
