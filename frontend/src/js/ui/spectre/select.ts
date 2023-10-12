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

function renderTooltipContent(content: m.Children) {
	if (typeof content === 'string') {
		return content;
	}

	const tooltipContent = document.createElement('div');
	m.render(tooltipContent, content);
	return tooltipContent;
}

export type OnInputEvent = {
	target: {
		value: string;
	};
	value: string;
};

type SelectProps = {
	keys: string[];
	names?: string[];
	selected: string | null;
	default?: string;
	noDefault?: boolean;
	width?: number;
	onInput: (e: OnInputEvent) => void;
};

type SelectState = {
	onInput: (e: any) => void;
	tooltip: any | null;
	open: boolean;
};

export default (): m.Component<SelectProps> => {
	const state: SelectState = {
		onInput: (e) => {},
		tooltip: null,
		open: false,
	};

	const destroyTooltip = () => {
		if (state.tooltip) {
			state.tooltip.destroy();
			state.tooltip = null;
			state.open = false;
		}
	};

	const getSelect = (vnode: m.Vnode<SelectProps, {}>) => {
		const renderOptions = (tag: string, onClick?: (key: string) => void, classNames?: string) => [
			// If noDefault is set, we don't want to render the default option.
			vnode.attrs.noDefault
				? null
				: m(
						`${tag}${classNames ?? ''}`,
						{
							value: '',
							selected: !vnode.attrs.selected || vnode.attrs.selected.length === 0,
							onclick: () => onClick?.(''),
						},
						vnode.attrs.default ?? 'Choose an option...',
				  ),
			// Render all the options.
			vnode.attrs.keys.map((k, i) => {
				let text = k;
				if (vnode.attrs.names) {
					text = vnode.attrs.names[i];
				}
				return m(
					`${tag}${classNames ?? ''}`,
					{
						value: k,
						selected: vnode.attrs.selected === k,
						onclick: () => onClick?.(k),
					},
					text,
				);
			}),
		];

		return m('div.relative', [
			m(
				'select.form-select',
				{
					value: vnode.attrs.selected,
					onmousedown: (e: any) => {
						e.preventDefault();
						e.target.blur();
						e.target.focus();
						window.focus();

						state.open = !state.open;

						if (state.open) {
							const content = renderTooltipContent(
								m(
									`div.bg-white.black-80.overflow-auto.overscroll-contain.${dropdownStyle}`,
									{ style: { width: e.target.getBoundingClientRect().width + 'px' } },
									renderOptions(
										'div',
										(key) => {
											state.onInput(key);
											destroyTooltip();
										},
										'.item-pad.pointer.dim',
									),
								),
							);

							if (state.tooltip) {
								state.tooltip.setContent(content);
							} else {
								state.tooltip = Tippy(e.target, {
									placement: 'bottom',
									content: content,
									showOnCreate: true,
									hideOnClick: false,
									trigger: 'manual',
									arrow: false,
									interactive: true,
								});
							}
						} else if (!state.open) {
							destroyTooltip();
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
						}, 200);
					},
				},
				[...renderOptions('option')],
			),
		]);
	};

	// We need to update the oninput value on create and update of component,
	// otherwise we miss updates to this callback.
	const setOnInput = (vnode: m.Vnode<SelectProps, {}>) => {
		state.onInput = (value) => {
			vnode.attrs.onInput({ target: { value: value }, value });
			m.redraw();
		};
	};

	const updateSize = (vnode: m.VnodeDOM<SelectProps>) => {
		if (!vnode.attrs.width || vnode.attrs.width == 0) return;

		let dropdownElement = vnode.dom.parentElement?.parentElement;
		if (!dropdownElement) return;

		(dropdownElement as HTMLElement).style.width = `${vnode.attrs.width}px`;
	};

	return {
		oncreate(vnode) {
			setOnInput(vnode);
		},
		onupdate(vnode) {
			setOnInput(vnode);
		},
		onremove(vnode) {
			destroyTooltip();
		},
		view(vnode) {
			return m(`div.${tippyStyle}`, getSelect(vnode));
		},
	};
};
