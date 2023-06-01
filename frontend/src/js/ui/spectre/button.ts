import m from 'mithril';

type ButtonProps = {
	onclick?: () => void;
	intend?: 'primary' | 'success' | 'error' | 'warning' | 'link';
	size?: 'sm' | 'lg';
	loading?: boolean;
	classNames?: string;
};

export default (): m.Component<ButtonProps> => {
	return {
		view(vnode) {
			let classes = '.btn';
			if (vnode.attrs.intend) {
				classes += '.btn-' + vnode.attrs.intend;
			}
			if (vnode.attrs.size) {
				classes += '.btn-' + vnode.attrs.size;
			}
			if (vnode.attrs.loading) {
				classes += '.loading';
			}

			return m('button' + classes + (vnode.attrs.classNames ?? ''), { onclick: vnode.attrs.onclick }, vnode.children);
		},
	};
};
