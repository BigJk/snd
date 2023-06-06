import m from 'mithril';

import Button from 'js/ui/spectre/button';

import Base from 'js/ui/components/base';
import Box from 'js/ui/components/box';
import Hero from 'js/ui/components/hero';
import InfoIcon from 'js/ui/components/info-icon';
import Logo from 'js/ui/components/logo';
import SideMenu from 'js/ui/components/side-menu';
import Title from 'js/ui/components/title';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(
				Base,
				{ title: m(Title, 'Dashboard'), active: 'dashboard', classNames: '.pa3' },
				m('div', [
					m(Hero, {
						title: 'Welcome to Sales & Dungeons!',
						icon: m('div.flex-shrink-0', m(Logo, { classNames: '.mb3.ml3', scale: 1.5 })),
						subtitle:
							'With Sales & Dungeons you can create highly customizable handouts, quick reference and much more for your Dungeons and Dragons (or other PnP) Sessions. Most Thermal Printer are small in size and can be taken with you and kept right at the gaming table. Use-cases range from printing out magic items, spells or a letter that the group found to little character sheets of your players to use as DM note. The possibilities are nearly endless!',
						footer: [
							m(Button, { classNames: '.mr3' }, 'Documentation'),
							m(Button, { classNames: '.mr3', intend: 'primary' }, 'Join Discord'),
							m(Button, { intend: 'error' }, 'Support the Project'),
						],
					}),
					m(Box, { classNames: '.mt3', width: 300 }, [
						m(
							InfoIcon,
							'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.'
						),
					]),
					m(
						'div.pa2',
						m(SideMenu, {
							items: [
								{ title: 'Basic Information', icon: 'information-circle-outline', active: true },
								{ title: 'Images', icon: 'images', active: false },
								{ title: 'Skeleton Data', icon: 'body', active: false },
								{ title: 'Print Template', icon: 'code-working', active: false },
								{ title: 'List Template', icon: 'code-working', active: false },
							],
						})
					),
				])
			);
		},
	};
};
