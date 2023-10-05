import m from 'mithril';

import Button from 'js/ui/spectre/button';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

type PaginatedContentProps<T> = {
	perPage: number;
	items: T[];
	renderItem: (item: T) => m.Children;
	pageOpened?: (page: number, items: T[]) => void;
};

type PaginatedContentState = {
	page: number;
	lastItemCount: number;
};

export default <T>(): m.Component<PaginatedContentProps<T>> => {
	const state: PaginatedContentState = {
		page: 0,
		lastItemCount: 0,
	};

	const getPage = (attrs: PaginatedContentProps<T>) => {
		return attrs.items.slice(state.page * attrs.perPage, (state.page + 1) * attrs.perPage);
	};

	const maxPage = (attrs: PaginatedContentProps<T>) => {
		return Math.floor(attrs.items.length / attrs.perPage);
	};

	const nextPage = (attrs: PaginatedContentProps<T>) => {
		console.log('nextPage');
		if (state.page >= Math.floor(attrs.items.length / attrs.perPage)) return;
		state.page++;

		if (attrs.pageOpened) {
			attrs.pageOpened(state.page, getPage(attrs));
		}
	};

	const prevPage = (attrs: PaginatedContentProps<T>) => {
		if (state.page === 0) return;
		state.page--;

		if (attrs.pageOpened) {
			attrs.pageOpened(state.page, getPage(attrs));
		}
	};

	return {
		oninit({ attrs }) {
			state.lastItemCount = attrs.items.length;
			if (attrs.pageOpened) {
				attrs.pageOpened(state.page, getPage(attrs));
			}
		},
		onupdate({ attrs }) {
			if (attrs.items.length !== state.lastItemCount) {
				state.lastItemCount = attrs.items.length;
				state.page = 0;

				if (attrs.pageOpened) {
					attrs.pageOpened(state.page, getPage(attrs));
				}

				m.redraw();
			}
		},
		view: ({ attrs, children }) => {
			return m(Flex, { direction: 'column', className: '.overflow-auto.h-100' }, [
				m(Flex, { direction: 'column', className: '.flex-grow-1.overflow-auto.h-100' }, getPage(attrs).map(attrs.renderItem)), //
				m(
					'div.flex-shrink-0.pa3.bt.b--black-10',
					m(Flex, { justify: 'between' }, [
						children, //
						m(Flex, { items: 'center' }, [
							m(Button, { onClick: () => prevPage(attrs) }, m(Icon, { icon: 'arrow-round-back' })), //
							m('div.w3.tc', `${state.page + 1} / ${maxPage(attrs) + 1}`),
							m(Button, { onClick: () => nextPage(attrs) }, m(Icon, { icon: 'arrow-round-forward' })),
						]),
					]),
				),
			]);
		},
	};
};
