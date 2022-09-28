import buySvg from '/img/buy.svg';
import dungeonSvg from '/img/dungeon.svg';

export default () => {
	return {
		view(vnode) {
			return (
				<div className='flex items-center z-5' style={{ zoom: vnode.attrs.scale ?? 1.0 }}>
					<img src={dungeonSvg} className='z-1' alt='' height={40} />
					<img src={buySvg} className='z-0' alt='' height={32} style={{ margin: '-15px 0 0 -20px', transform: 'rotate(25deg)' }} />
				</div>
			);
		},
	};
};
