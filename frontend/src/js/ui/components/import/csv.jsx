import { shell } from '/js/electron';

export default {
	name: 'CSV',
	view: () => ({
		view(vnode) {
			return (
				<div>
					<div className='mt2 mb3 lh-copy'>
						You can import data from simple CSV files that you exported from Google Sheets or Excel. Visit the{' '}
						<a className='pointer' onclick={() => shell.openExternal('https://github.com/BigJk/snd/wiki/Import-&-Export#csv')}>
							Wiki
						</a>{' '}
						for more information on the layout.
					</div>
					<div className='btn btn-primary mr2' onclick={() => vnode.attrs.onimport('csv')}>
						Import CSV (data.csv)
					</div>
				</div>
			);
		},
	}),
};
