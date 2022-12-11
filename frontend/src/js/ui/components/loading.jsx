export default () => ({
	view(vnode) {
		return (
			<div className='flex-grow-1 flex justify-center items-center'>
				<div className='loading loading-lg' />
			</div>
		);
	},
});
