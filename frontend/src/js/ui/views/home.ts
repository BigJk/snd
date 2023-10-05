import m from 'mithril';

import store from 'js/core/store';

import Button from 'js/ui/spectre/button';

import Logo from 'js/ui/components/atomic/logo';
import Title from 'js/ui/components/atomic/title';
import BoxVersion from 'js/ui/components/box-version';
import DiscordWidget from 'js/ui/components/discord-widget';
import Hero from 'js/ui/components/hero';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';

export default (): m.Component => {
	return {
		view(vnode) {
			return m(
				Base,
				{ title: m(Title, 'Dashboard'), active: 'dashboard', classNameContainer: '.pa3' },
				m(Flex, { className: '.flex-gap-3' }, [
					m(
						'div',
						m(Hero, {
							title: 'Welcome to Sales & Dungeons!',
							icon: m('div.flex-shrink-0', m(Logo, { className: '.mb3.ml3', scale: 1.5 })),
							subtitle:
								'With Sales & Dungeons you can create highly customizable handouts, quick reference and much more for your Dungeons and Dragons (or other PnP) Sessions. Most Thermal Printer are small in size and can be taken with you and kept right at the gaming table. Use-cases range from printing out magic items, spells or a letter that the group found to little character sheets of your players to use as DM note. The possibilities are nearly endless!',
							footer: [
								m(Button, { className: '.mr3', link: 'https://github.com/BigJk/snd' }, 'Documentation'),
								m(Button, { className: '.mr3', intend: 'primary', link: 'https://discord.gg/W95s9kcUk4' }, 'Join Discord'),
								m(Button, { intend: 'error', link: 'https://ko-fi.com/bigjk' }, 'Support the Project'),
							],
						}),
					),
					m(Flex, { className: '.flex-gap-3', direction: 'column' }, [
						m(BoxVersion, {
							newVersion: !store.value.version.latest?.newest ?? false,
							newVersionTag: store.value.version.latest?.tag.name ?? '',
						}),
						m('div', m(DiscordWidget, { className: 'w-100', height: 400 })),
					]),
				]),
			);
		},
	};
};
