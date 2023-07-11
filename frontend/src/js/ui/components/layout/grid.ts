import m from 'mithril';

type GridProps = {
	className?: string;
	minWidth?: string;
	maxWidth?: string;
	gap?: string;
};

/**
 * Grid component: renders a grid.
 */
export default (): m.Component<GridProps> => {
	return {
		view({ attrs, children }) {
			let min = attrs.minWidth ?? '400px';
			let max = attrs.maxWidth ?? '1fr';
			let gap = attrs.gap ?? '1rem';

			let style = {
				display: 'grid',
				gridTemplateColumns: `repeat(auto-fit, minmax(${min}, ${max}))`,
				gridGap: gap,
			};

			return m(
				`div${attrs.className ?? ''}`,
				{
					style,
				},
				children
			);
		},
	};
};
