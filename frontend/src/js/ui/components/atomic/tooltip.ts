import m from 'mithril';

import Tippy from 'tippy.js';

type TooltipProps = {
	content: m.Children;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	interactive?: boolean;
	maxWidth?: number;
};

function renderTooltipContent(content: m.Children) {
	if (typeof content === 'string') {
		return content;
	}

	const tooltipContent = document.createElement('div');
	m.render(tooltipContent, content);
	return tooltipContent;
}

/**
 * Tooltip component: renders a tooltip.
 */
export default (): m.Component<TooltipProps> => {
	let tippyInstance: any = null;
	return {
		oncreate(vnode) {
			const tooltipContent = renderTooltipContent(vnode.attrs.content);

			tippyInstance = Tippy(vnode.dom, {
				maxWidth: vnode.attrs.maxWidth ?? 220,
				content: tooltipContent,
				interactive: vnode.attrs.interactive ?? false,
				placement: vnode.attrs.placement ?? 'top',
			});
		},
		onupdate(vnode) {
			const tooltipContent = renderTooltipContent(vnode.attrs.content);
			tippyInstance.setContent(tooltipContent);
		},
		onremove() {
			tippyInstance.destroy();
		},
		view(vnode) {
			return vnode.children;
		},
	};
};
