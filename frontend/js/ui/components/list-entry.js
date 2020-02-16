import m from 'mithril';

export default () => {
	return {
		view(vnode) {
			return (
				<div className={'list-entry ph3 pv2 bb b--black-10 pointer hover-bg-light-gray f5 lh-solid relative ' + vnode.attrs.className} onclick={vnode.attrs.onclick}>
					{vnode.children}
					{vnode.attrs.active ? <div className="absolute h-100 left-0 top-0 wsmall bg-blue" /> : null}
				</div>
			);
		}
	};
};
