import m from 'mithril';

import { flatMap } from 'lodash-es';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

import { dialogWarning } from 'js/ui/toast';

type BreadcrumbItem = {
	label: m.Children;
	link?: string;
};

export type BreadcrumbProps = {
	confirm?: boolean;
	items: BreadcrumbItem[];
};

export default (): m.Component<BreadcrumbProps> => {
	const putBetween = (arr: Array<any>, obj: any) => {
		return flatMap(arr, (item, index) => (index === arr.length - 1 ? [item] : [item, obj]));
	};

	const onClick = (item: BreadcrumbItem, confirm?: boolean) => {
		if (!item.link) return;

		let link = item.link;
		if (confirm) {
			dialogWarning('Are you sure you want to navigate?').then((result) => {
				m.route.set(link);
			});
		} else {
			m.route.set(item.link);
		}
	};

	return {
		view({ attrs }) {
			return m(
				'div.dib.bg-primary-muted.ph2.pv1.br2',
				m(
					Flex,
					{ items: 'center' },
					putBetween(
						attrs.items.map((item) => {
							if (!item.link) {
								return m('span.b', item.label);
							}

							return m('span.pointer.underline-hover.col-primary.fw5', { onclick: () => onClick(item, attrs.confirm) }, item.label);
						}),
						m(Icon, { icon: 'arrow-dropright', className: '.mh2.o-50' })
					)
				)
			);
		},
	};
};
