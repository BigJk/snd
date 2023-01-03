export default () => ({
	view(vnode) {
		if (!vnode.attrs.show) return null;

		return (
			<div className='modal active absolute'>
				<div className='modal-overlay' />
				<div className='absolute flex flex-column'>
					<div className='loading loading-lg mb2' />
					<div className='black-70'>{vnode.attrs.content ? vnode.attrs.content : 'Printing...'}</div>
				</div>
			</div>
		);
	},
});
