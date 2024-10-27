import m from 'mithril';

import Entry from 'js/types/entry';
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
	entry?: Entry;
	config?: any;
	tabs: TabDefinition[];
	content: Record<string, () => m.Component>;
	onRendered?: (html: string) => void;
	onMessage?: (type: string, data: any) => void;
	hidePreview?: boolean;
};

export default (): m.Component<SidebarPrintProps> => {
	let selectedTab: string = '';

	const leftElement = (icon: string, label: string, active: boolean, onClick: () => void) =>
		m(Tooltip, { content: label, placement: 'right' }, [m(Icon, { icon, size: 5, onClick, className: active ? '.text-primary' : '' })]);

	return {
		oninit: (vnode) => {
			selectedTab = vnode.attrs.tabs[0].label;
		},
		view: (vnode) =>
			m(Flex, { className: '.flex-gap-3.h-100' }, [
				vnode.attrs.tabs.length > 1
					? m(
							'div.flex-shrink-0',
							m(Flex, { direction: 'column', className: '.pa2.bg-white.ba.b--black-10.br2.flex-gap-3' }, [
								...vnode.attrs.tabs.map((tab) => {
									if (!tab) {
										return null;
									}
									return leftElement(tab.icon, tab.label, selectedTab === tab.label, () => (selectedTab = tab.label));
								}),
							]),
						)
					: null, //
				// @ts-ignore
				m(Flex, { className: '.bg-white.ba.b--black-10.br2.flex-grow-1.overflow-auto', direction: 'column' }, vnode.attrs.content[selectedTab]()),
				vnode.attrs.template || vnode.attrs.generator
					? m(PrintPreviewTemplate, {
							template: vnode.attrs.template,
							generator: vnode.attrs.generator,
							it: vnode.attrs.it,
							entry: vnode.attrs.entry,
							config: vnode.attrs.config,
							width: 380,
							className: `.bg-black-05.ph1.ba.b--black-10${!vnode.attrs.hidePreview ? '' : '.o-0'}`,
							onRendered: vnode.attrs.onRendered,
							onMessage: vnode.attrs.onMessage,
						})
					: m('div'),
			]),
	};
};
