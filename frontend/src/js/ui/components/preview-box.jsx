import { Preview } from './index';

import store from '/js/core/store';

export default function () {
	return {
		view(vnode) {
			return (
				<div className={vnode.attrs.className}>
					<div className='flex br1 br--right b--black-10 mb2' style={{ minHeight: '200px', boxShadow: '0px 0px 8px 0px rgba(0,0,0,0.03)' }}>
						{vnode.attrs.previewContent ? (
							<div
								className='flex-shrink-0 ph1 mr1 b--dashed br-0 bl-0 bw1 b--black-05'
								style={{ backgroundColor: '#f2f2f2', borderRight: '1px solid rgba(0,0,0,0.05)', borderLeft: '1px solid rgba(0,0,0,0.05)' }}
							>
								<Preview
									className='h-100'
									content={vnode.attrs.previewContent}
									stylesheets={store.data.settings.stylesheets}
									width={150}
									scale={150 / store.data.settings.printerWidth}
									loading={vnode.attrs.loading}
								/>
							</div>
						) : null}
						<div className='flex-grow-1 pa2 lh-solid flex flex-column justify-between ba b--black-10 br1 br--right bg-white'>
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
