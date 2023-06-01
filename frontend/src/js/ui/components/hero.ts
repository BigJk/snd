import m from 'mithril';

import Button from 'js/ui/spectre/button';

export default (): m.Component => {
	return {
		view(vnode) {
			return m('div.ph4.pv3.grid-bg.br3.w-100.white', [
				m('div.f5.mb3', 'Welcome to Sales & Dungeons!'),
				m(
					'div.white-70.lh-copy.mb3',
					'With Sales & Dungeons you can create highly customizable handouts, quick reference and much more for your Dungeons and Dragons (or other PnP) Sessions. Most Thermal Printer are small in size and can be taken with you and kept right at the gaming table. Use-cases range from printing out magic items, spells or a letter that the group found to little character sheets of your players to use as DM note. The possibilities are nearly endless!'
				),
				m('div.flex', [m(Button, { classNames: '.mr3' }, 'Documentation'), m(Button, { intend: 'primary' }, 'Join Discord')]),
			]);
		},
	};
};
