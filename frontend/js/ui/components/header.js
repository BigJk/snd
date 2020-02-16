import m from 'mithril';

const dungeonSvg = require('../../../img/dungeon.svg');
const buySvg = require('../../../img/buy.svg');

export default () => {
	return {
		view() {
			return (
				<div className="w-100 ph3 pv2 header white flex items-center flex-shrink-0">
					<div className="flex items-center">
						<img src={dungeonSvg} className="z-1" alt="" height={40} />
						<img src={buySvg} className="z-0" alt="" height={32} style={{ margin: '-15px 0 0 -20px', transform: 'rotate(25deg)' }} />
					</div>
					<span className="f5 lh-solid i">
						<span className="pl1 f6">Sales &</span>
						<br />
						Dungeons
					</span>
				</div>
			);
		}
	};
};
