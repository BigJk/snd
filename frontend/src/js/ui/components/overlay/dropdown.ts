import m from 'mithril';

import Tippy from 'tippy.js';

import { css } from 'goober';

const dropdownStyle = css`
	border: 0.05rem solid #bcc3ce;
	max-height: 300px;

	.item-pad {
		padding: 0.125rem 0.4rem;
	}
`;

const tippyStyle = css`
	.tippy-content {
		padding: 0;
	}
`;

type DropdownProps = {
	content: m.Children;
	onMouseDown?: (e: any) => void;
	onClose?: () => void;
	onOpen?: () => void;
};

type SelectState = {
	tooltip: any | null;
	open: boolean;
	dom: HTMLElement | null;
};

export default (): m.Component<DropdownProps> => {
	const state: SelectState = {
		tooltip: null,
		open: false,
		dom: null,
	};

	const renderTooltipContent = (content: m.Children) => {
		if (typeof content === 'string') {
			return content;
		}

		const tooltipContent = document.createElement('div');
		m.render(
			tooltipContent,
			m(
				`div.bg-white.black-80.overflow-auto.overscroll-contain.${dropdownStyle}`,
				{ style: { width: state.dom ? state.dom.getBoundingClientRect().width + 'px' : '' } },
				content,
			),
		);
		return tooltipContent;
	};

	const destroyTooltip = (onClose?: () => void) => {
		if (state.tooltip) {
			state.tooltip.destroy();
			state.tooltip = null;
			state.open = false;
			onClose?.();
		}
	};

	return {
		oncreate(vnode) {
			state.dom = vnode.dom as HTMLElement;
		},
		onremove(vnode) {
			destroyTooltip();
		},
		onupdate(vnode) {
			state.dom = vnode.dom as HTMLElement;

			if (state.open && state.tooltip) {
				const content = renderTooltipContent(vnode.attrs.content);
				state.tooltip.setContent(content);
			}
		},
		view(vnode) {
			return m(
				`div.${tippyStyle}`,
				{
					onmousedown: (e: any) => {
						vnode.attrs.onMouseDown?.(e);

						state.open = !state.open;

						if (state.open) {
							const content = renderTooltipContent(vnode.attrs.content);

							if (state.tooltip) {
								state.tooltip.setContent(content);
							} else {
								vnode.attrs.onOpen?.();

								state.tooltip = Tippy(e.target, {
									placement: 'bottom-start',
									content: content,
									showOnCreate: true,
									hideOnClick: false,
									trigger: 'manual',
									arrow: false,
									interactive: true,
								});
							}
						}
					},
					onfocusout: () => {
						// Focus handling is a bit tricky here. We want to close the dropdown
						// when the user clicks outside of it, but we also want to keep it open
						// when the user clicks on the dropdown itself.
						//
						// We also need the timeout here, because otherwise the dropdown will
						// close before the click event on the option is registered.
						state.open = false;
						setTimeout(() => {
							// If the dropdown was already open, we don't want to close it.
							// This happens when the user clicks on the dropdown itself.
							if (state.open) return;

							if (state.tooltip) {
								destroyTooltip();
							}
						}, 100);
					},
				},
				vnode.children,
			);
		},
	};
};
