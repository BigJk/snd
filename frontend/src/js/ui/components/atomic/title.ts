import m from 'mithril';

type TitleProps = {
	className?: string;
};

/**
 * Title component: renders a title.
 */
export default (): m.Component<TitleProps> => {
	return {
		view(vnode) {
			return m(`div.f5.b${vnode.attrs.className ?? ''}`, vnode.children);
		},
	};
};
