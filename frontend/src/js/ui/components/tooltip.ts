import m from 'mithril';

import Tippy from 'tippy.js';

type TooltipProps = {
	content: m.Children;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	interactive?: boolean;
};

function renderTooltipContent(content: m.Children) {
	if (typeof content === 'string') {
		return content;
	}

	const tooltipContent = document.createElement('div');
	m.render(tooltipContent, content);
	return tooltipContent;
}

export default (): m.Component<TooltipProps> => ({
	oncreate(vnode) {
		const tooltipContent = renderTooltipContent(vnode.attrs.content);

		Tippy(vnode.dom, {
			maxWidth: 220,
			content: tooltipContent,
			interactive: vnode.attrs.interactive ?? false,
			placement: vnode.attrs.placement ?? 'top',
		});
	},
	view(vnode) {
		return vnode.children;
	},
});
