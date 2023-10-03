import m from 'mithril';

type GridProps = {
	className?: string;
	minWidth?: string;
	maxWidth?: string;
	gap?: number;
};

/**
 * Grid component: renders a grid.
 */
export default (): m.Component<GridProps> => {
	return {
		view({ attrs, children }) {
			let min = attrs.minWidth ?? '400px';
			let max = attrs.maxWidth ?? '1fr';

			let style = {
				display: 'grid',
				gridTemplateColumns: `repeat(auto-fit, minmax(${min}, ${max}))`,
			};

			return m(
				`div${attrs.className ?? ''}${attrs.gap ? `.gap-${attrs.gap}` : '.gap-3'}`,
				{
					style,
				},
				children
			);
		},
	};
};
