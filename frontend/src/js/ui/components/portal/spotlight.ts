import m from 'mithril';
import { capitalize, debounce } from 'lodash-es';

import Fuse from 'fuse.js';

import guid from 'js/core/guid';
import store, { FuseSearch } from 'js/core/store';

import Icon from 'js/ui/components/atomic/icon';
import Key from 'js/ui/components/atomic/key';
import Flex from 'js/ui/components/layout/flex';
import { clearPortal } from 'js/ui/portal';

const ItemHeight = 60;

import FuseResult = Fuse.FuseResult;

type SpotlightState = {
	id: string;
	query: string;
	selected: number;
	result?: FuseResult<FuseSearch>[] | null;
};

const icons = {
	template: 'list-box',
	generator: 'switch',
	source: 'analytics',
};

export default (): m.Component => {
	let state: SpotlightState = {
		id: 'spotlight-' + guid(),
		query: '',
		selected: -1,
		result: null,
	};

	const updateSearch = debounce(() => {
		state.selected = -1;
		document.querySelector('.' + state.id)?.scrollTo(0, 0);
		state.result = store.value.fuzzySearch?.search(state.query);
		m.redraw();
	}, 250);

	const onInput = (e: InputEvent) => {
		state.query = e.target ? (e.target as HTMLInputElement).value : '';
		updateSearch();
	};

	const openItem = (item: FuseResult<FuseSearch>) => {
		if (item.item.type === 'operation') {
			item.item.operation?.onExecute();
		} else if (item.item.type === 'source') {
			m.route.set('/data-source/' + item.item.id);
		} else {
			m.route.set('/' + item.item.type + '/' + item.item.id);
		}

		// TODO: This component should not be responsible for this.
		// Move this to a onOpen callback and let the parent handle it.
		// At the moment we don't do this as props are not passable to the portal yet.
		clearPortal();
	};

	const itemBackground = (type: string) => {
		switch (type) {
			case 'operation':
				return '.bg-dark';
		}
		return '.bg-primary';
	};

	// Render the results.
	const results = () => {
		if (state.result === undefined || state.result === null || state.result.length === 0) {
			return m(
				Flex,
				{
					className: '.h-100.text-muted',
					items: 'center',
					justify: 'center',
				},
				'Nothing found',
			);
		}

		return m(
			'div',
			state.result.map((item, i) => {
				let name = item.item[item.item.type]?.name;

				return m(
					`div.pa2.bb.b--black-10.lh-copy.pointer.bg-animate${i == state.selected ? '.bg-black-10.hover-bg-black-20' : '.hover-bg-black-05'}`,
					{
						style: { height: ItemHeight + 'px' },
						onclick: () => openItem(item),
					},
					m(
						Flex,
						{
							items: 'center',
						},
						[
							m(
								Flex,
								{ className: `.w2.h2.br2.white.mr2${itemBackground(item.item.type)}`, items: 'center', justify: 'center' },
								m(Icon, { icon: item.item.type != 'operation' ? icons[item.item.type] : item.item.operation?.icon ?? '', size: 5 }),
							), //
							m('div', [
								m('div.b', name), //
								m('div.text-muted', capitalize(item.item.type)),
							]),
						],
					),
				);
			}),
		);
	};

	// Render the header with the search input.
	const header = () =>
		m(Flex, { className: '.pa2.bb.b--black-10', items: 'center' }, [
			m(Icon, { icon: 'search', className: '.mr2', size: 5 }), //
			m('input.bn.outline-0.f5.flex-grow-1', { oninput: onInput }),
		]);

	// Render the footer with the key bindings.
	const footer = () =>
		m(Flex, { className: '.pa2.bt.b--black-10', justify: 'end' }, [
			m(
				// @ts-ignore
				Key,
				{
					key: [
						m(Icon, { icon: 'arrow-down', className: '.mr1', size: 7 }), //
						m(Icon, { icon: 'arrow-up', size: 7 }),
					],
					className: '.mr2',
				},
				'Navigate',
			), //
			m(Key, { key: 'enter', className: '.mr2' }, 'Open'),
			m(Key, { key: 'esc' }, 'Exit'),
		]);

	return {
		oncreate(vnode): any {
			vnode.dom.querySelector('input')?.focus();

			// Register key up and down events to navigate the results and enter, also scroll down to the element if it's not visible.
			window.addEventListener('keydown', (e) => {
				if (e.key == 'ArrowDown') {
					if (!state.result) return;

					state.selected = Math.min(state.selected + 1, state.result.length - 1);

					// Scroll down only if the element is not visible.
					let container = vnode.dom.querySelector('div:nth-child(2)') as HTMLElement;
					if (state.selected * ItemHeight > container.scrollTop + container.offsetHeight) {
						container.scrollTop = state.selected * ItemHeight;
					}

					m.redraw();
				} else if (e.key == 'ArrowUp') {
					state.selected = Math.max(state.selected - 1, 0);

					// Scroll up only if the element is not visible.
					let container = vnode.dom.querySelector('div:nth-child(2)') as HTMLElement;
					if (state.selected * ItemHeight < container.scrollTop) {
						container.scrollTop = state.selected * ItemHeight;
					}

					m.redraw();
				} else if (e.key == 'Enter') {
					if (state.result && state.selected >= 0 && state.selected < state.result.length) {
						openItem(state.result[state.selected]);
					}
				}
			});

			// Prevent the input to be affected by the up arrow.
			vnode.dom.querySelector('input')?.addEventListener('keydown', function (e) {
				if (e.keyCode == 38 || e.keyCode == 40) {
					e.preventDefault();
				}
			});
		},
		view() {
			return m('div.bg-white.ba.b--black-10.br2', { style: { width: '600px', 'box-shadow': 'rgba(149, 157, 165, 0.35) 0px 8px 24px' } }, [
				header(), //
				m(
					'div.overflow-auto.' + state.id,
					{ style: { minHeight: '200px', maxHeight: '70vh', height: state.result ? state.result.length * ItemHeight + 'px' : '200px' } },
					results(),
				),
				footer(),
			]);
		},
	};
};
