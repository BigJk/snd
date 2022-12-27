export default {
	view(vnode) {
		return (
			<div className='modal active' id='modal-id'>
				<div className='modal-overlay' onclick={vnode.attrs.noclose === true ? null : vnode.attrs.onclose} />
				<div className='modal-container'>
					<div className='modal-header pt2 flex justify-between items-start'>
						<div className='modal-title f4'>{vnode.attrs.title}</div>
						{vnode.attrs.noclose === true ? null : <div className='btn btn-clear mt1' onclick={vnode.attrs.onclose} />}
					</div>
					<div className={`modal-body ${vnode.attrs.className}`}>
						<div className='content pb2'>{vnode.children}</div>
					</div>
				</div>
			</div>
		);
	},
};
