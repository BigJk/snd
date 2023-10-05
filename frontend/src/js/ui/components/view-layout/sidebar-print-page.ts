import m from 'mithril';

import Generator from 'js/types/generator';
import Template from 'js/types/template';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';

type TabDefinition = {
	icon: string;
	label: string;
};

type SidebarPrintProps = {
	template?: Template;
	generator?: Generator;
	it?: any;
	config?: any;
	tabs: TabDefinition[];
	content: Record<string, () => m.Component>;
};

export default (): m.Component<SidebarPrintProps> => {
	let selectedTab: string = '';

	const leftElement = (icon: string, label: string, active: boolean, onClick: () => void) => {
		return m(Tooltip, { content: label, placement: 'right' }, [m(Icon, { icon, size: 5, onClick, className: active ? '.text-primary' : '' })]);
	};

	return {
		oninit: (vnode) => {
			selectedTab = vnode.attrs.tabs[0].label;
		},
		view: (vnode) => {
			return m(Flex, { className: '.flex-gap-3.h-100' }, [
				m(
					'div.flex-shrink-0',
					m(Flex, { direction: 'column', className: '.pa2.bg-white.ba.b--black-10.br2.flex-gap-3' }, [
						...vnode.attrs.tabs.map((tab) => {
							if (!tab) {
								return null;
							}
							return leftElement(tab.icon, tab.label, selectedTab === tab.label, () => (selectedTab = tab.label));
						}),
					]),
				), //
				// @ts-ignore
				m(Flex, { className: '.bg-white.ba.b--black-10.br2.flex-grow-1.overflow-auto', direction: 'column' }, vnode.attrs.content[selectedTab]()),
				vnode.attrs.template || vnode.attrs.generator
					? m(PrintPreviewTemplate, {
							template: vnode.attrs.template,
							generator: vnode.attrs.generator,
							it: vnode.attrs.it,
							config: vnode.attrs.config,
							width: 380,
							className: '.bg-black-05.ph1.ba.b--black-10',
					  })
					: m('div'),
			]);
		},
	};
};
