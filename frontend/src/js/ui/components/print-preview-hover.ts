import m from 'mithril';

import { css } from 'goober';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';
import PrintPreview, { PrintPreviewProps } from 'js/ui/components/print-preview';

const titleClass = css`
	height: 40px;
	cursor: grab;
`;

type Origin = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type PrintPreviewHoverProps = PrintPreviewProps & {
	hide?: boolean;
	origin?: Origin;
	initialX?: number;
	initialY?: number;
	initialHeight?: number;
};

type PrintPreviewHoverState = {
	dom: HTMLElement | null;
	hide: boolean;
	height: number;
	dragging: boolean;
	mouseInside: boolean;
};

export default (): m.Component<PrintPreviewHoverProps> => {
	let state: PrintPreviewHoverState = {
		dom: null,
		hide: false,
		height: 400,
		dragging: false,
		mouseInside: false,
	};

	const moveWindow = (dom: HTMLElement, origin: Origin, x: number, y: number) => {
		const { innerWidth, innerHeight } = window;
		const { width, height } = dom.getBoundingClientRect();

		let left = 0;
		let top = 0;

		if (origin.includes('left')) {
			left = x;
		} else {
			left = innerWidth - x - width;
		}

		if (origin.includes('top')) {
			top = y;
		} else {
			top = innerHeight - y - height;
		}

		dom.style.left = left + 'px';
		dom.style.top = top + 'px';
	};

	const minimizeWindow = () => {
		if (!state.dom) {
			return;
		}

		const { x, y, width, height } = state.dom.getBoundingClientRect();

		if (state.hide) {
			moveWindow(state.dom, 'top-left', x, y + height - state.height - 42);
		} else {
			moveWindow(state.dom, 'top-left', x, y + height - 42);
		}

		state.hide = !state.hide;
	};

	const onDragStart = (e: MouseEvent) => {
		if (!state.dom) {
			return;
		}

		const { x, y } = state.dom.getBoundingClientRect();
		moveWindow(state.dom, 'top-left', x, y);
		state.dragging = true;
	};

	const onDragEnd = (e: MouseEvent) => {
		if (!state.dom) {
			return;
		}

		const { x, y } = state.dom.getBoundingClientRect();
		moveWindow(state.dom, 'top-left', x, y);
		state.dragging = false;
	};

	const onDrag = (e: MouseEvent) => {
		if (!state.dom || !state.dragging) {
			return;
		}

		const { x, y } = state.dom.getBoundingClientRect();
		moveWindow(state.dom, 'top-left', x + e.movementX, y + e.movementY);
	};

	return {
		oninit({ attrs }) {
			if (attrs.initialHeight !== undefined) {
				state.height = attrs.initialHeight;
			}
		},
		oncreate({ dom, attrs }) {
			if (attrs.initialX !== undefined && attrs.initialY !== undefined) {
				moveWindow(dom as HTMLElement, attrs.origin ?? 'top-left', attrs.initialX, attrs.initialY);
			}

			state.dom = dom as HTMLElement;
		},
		onupdate({ dom }) {
			state.dom = dom as HTMLElement;
		},
		view({ attrs }) {
			return m(
				`div.absolute.top-0.left-0.bg-white.ba.b--black-20.br1.z-max${state.mouseInside ? '' : '.o-50'}${attrs.hide === true ? '.dn' : ''}`,
				{
					onmouseenter: () => (state.mouseInside = true),
					onmouseleave: () => (state.mouseInside = false),
					style: { width: attrs.width + 'px', 'box-shadow': 'rgba(149, 157, 165, 0.35) 0px 8px 24px' },
				},
				[
					m(
						Flex,
						{
							justify: 'between',
							items: 'center',
							className: `.${titleClass}.ph2${state.hide ? '' : '.bb'}.b--black-20.bg-black-05`,
							onmousedown: onDragStart,
							onmouseleave: onDragEnd,
							onmouseup: onDragEnd,
							onmousemove: onDrag,
						},
						[
							m(Flex, { className: '.w-100.f8.fw5', items: 'center' }, [m(Icon, { icon: 'print', className: '.mr1', size: 7 }), 'Print Preview']), //
							m(Flex, { items: 'end' }, [m(Icon, { icon: 'remove', onClick: minimizeWindow })]),
						]
					), //
					state.hide ? null : m('div', { style: { height: state.height + 'px' } }, m(PrintPreview, { ...attrs, className: '.h-100' })),
				]
			);
		},
	};
};
