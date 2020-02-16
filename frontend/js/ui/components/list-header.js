import m from 'mithril';

export default () => {
	return {
		view(vnode) {
			return (
				<div className="bg-light-gray bb b--black-10 ph3 pv2 flex justify-between items-center flex-shrink-0">
					<span className="f6">{vnode.attrs.title}</span>
					<div style={{ display: 'contents' }}>{vnode.children}</div>
				</div>
			);
		}
	};
};
