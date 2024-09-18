import m from 'mithril';

import Grid from '../components/layout/grid';
import SupporterBar from '../components/supporter-bar';

import store from 'js/core/store';

import Button from 'js/ui/shoelace/button';

import Icon from 'js/ui/components/atomic/icon';
import Logo from 'js/ui/components/atomic/logo';
import Title from 'js/ui/components/atomic/title';
import Box from 'js/ui/components/box';
import BoxVersion from 'js/ui/components/box-version';
import DiscordWidget from 'js/ui/components/discord-widget';
import Hero from 'js/ui/components/hero';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';

export default (): m.Component => ({
	view(vnode) {
		return m(Base, { title: m(Title, 'Dashboard'), active: 'dashboard', classNameContainer: '.pa3' }, [
			m(SupporterBar),
			m(Grid, { columns: '3fr 1fr' }, [
				m(
					'div',
					m(Hero, {
						title: 'Welcome to Sales & Dungeons!',
						icon: m('div.flex-shrink-0', m(Logo, { className: '.mb3.ml3', scale: 1.5 })),
						subtitle:
							'With Sales & Dungeons you can create highly customizable handouts, quick reference and much more for your Dungeons and Dragons (or other PnP) Sessions. Most Thermal Printer are small in size and can be taken with you and kept right at the gaming table. Use-cases range from printing out magic items, spells or a letter that the group found to little character sheets of your players to use as DM note. The possibilities are nearly endless!',
						footer: [
							m(Button, { className: '.mr3', link: 'https://sales-and-dungeons.app/' }, 'Documentation'),
							m(Button, { className: '.mr3', intend: 'primary', link: 'https://discord.gg/W95s9kcUk4' }, 'Join Discord'),
							m(Button, { intend: 'error', link: 'https://ko-fi.com/bigjk' }, 'Support the Project'),
						],
					}),
				),
				m('div', m(DiscordWidget, { className: 'w-100' })),
				m(
					Box,
					{ className: '.w-100.ph4.pv3.flex.items-center' },
					m(Flex, { justify: 'between', items: 'center', className: '.w-100' }, [
						m(Flex, { gap: 2, items: 'center' }, [
							m(Flex, { className: '.w2.h2.br2.bg-primary', justify: 'center', items: 'center' }, m(Icon, { icon: 'list-box', className: '.white' })),
							m('div.ml2', [m('div.ttu.f7.b.text-muted', 'Templates'), m('div.f3', store.value.templates.length)]),
						]),
						m(Flex, { gap: 2, items: 'center' }, [
							m(Flex, { className: '.w2.h2.br2.bg-primary', justify: 'center', items: 'center' }, m(Icon, { icon: 'switch', className: '.white' })),
							m('div.ml2', [m('div.ttu.f7.b.text-muted', 'Generators'), m('div.f3', store.value.generators.length)]),
						]),
						m(Flex, { gap: 2, items: 'center' }, [
							m(Flex, { className: '.w2.h2.br2.bg-primary', justify: 'center', items: 'center' }, m(Icon, { icon: 'list', className: '.white' })),
							m('div.ml2', [m('div.ttu.f7.b.text-muted', 'Data Sources'), m('div.f3', store.value.sources.length)]),
						]),
					]),
				),
				m(BoxVersion, {
					newVersion: !store.value.version.latest?.newest ?? false,
					newVersionTag: store.value.version.latest?.tag.name ?? '',
				}),
			]),
		]);
	},
});
