import SideNav from '/js/ui/components/side-nav';

export default () => {
	return {
		view(vnode) {
			return (
				<div className='w-100 h-100 flex justify-between'>
					<SideNav active={vnode.attrs.active} />
					<div className='flex-grow-1 overflow-auto'>{vnode.children}</div>
				</div>
			);
		},
	};
};
