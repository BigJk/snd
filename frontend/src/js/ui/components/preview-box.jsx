import { Preview } from './index';

import store from '/js/core/store';

export default function () {
	return {
		view(vnode) {
			return (
				<div className={vnode.attrs.className}>
					<div className='flex ba b--black-10 mb2 bg-white' style={{ minHeight: '180px' }}>
						{vnode.attrs.previewContent ? (
							<div className='flex-shrink-0 ph1 br b--black-05 bg-black-05'>
								<Preview
									className='h-100'
									content={vnode.attrs.previewContent}
									stylesheets={store.data.settings.stylesheets}
									width={150}
									scale={150 / store.data.settings.printerWidth}
								/>
							</div>
						) : null}
						<div className='flex-grow-1 pa2 lh-solid flex flex-column justify-between'>
							<div>
								<div className='f5 mb2 flex justify-between items-start'>
									{vnode.attrs.value.name}

									<span className='f8 fw4 text-muted overflow-ellipsis'>
										{(() => {
											if (vnode.attrs.value.author && !vnode.attrs.value.slug) {
												return vnode.attrs.value.author;
											}

											return vnode.attrs.value.author + '/' + vnode.attrs.value.slug;
										})()}
									</span>
								</div>
								<div className='divider' />
								<div className='fw4 f7 black-50 mb1 lh-copy'>{vnode.attrs.value.description}</div>
							</div>
							<div className='flex justify-between items-end'>
								<div>{vnode.attrs.bottomLeft}</div>
								<div>{vnode.attrs.bottomRight}</div>
							</div>
						</div>
					</div>
				</div>
			);
		},
	};
}
