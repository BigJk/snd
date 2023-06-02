import m from 'mithril';

type ColumnProps = {
	size: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

export default (): m.Component<ColumnProps> => {
	return {
		view(vnode) {
			return m('div.col-' + vnode.attrs.size, vnode.children);
		},
	};
};
