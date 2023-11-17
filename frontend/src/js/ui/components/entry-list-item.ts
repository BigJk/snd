import m from 'mithril';

import Entry from 'js/types/entry';

import Flex from 'js/ui/components/layout/flex';

type EntryListItemProps = {
	entry: Entry;
	selected: boolean;
	bottom: m.Children;
	right: m.Children;
	onClick: () => void;
};

export default (): m.Component<EntryListItemProps> => ({
	view({ attrs }) {
		return m(
			`div${attrs.selected ? '.bl.bw2.b--col-primary.bg-primary-muted' : ''}`,
			m(
				Flex,
				{
					justify: 'between',
					className: `.pa2.bb.b--black-10.pointer${!attrs.selected ? '.hover-bg-primary-muted' : ''}`,
					onclick: attrs.onClick,
				},
				[
					m(`div`, {}, [
						m('div.f8.text-muted', attrs.entry.id), //
						m('div.f6.fw5', attrs.entry.name), //
						attrs.bottom,
					]),
					attrs.right,
				],
			),
		);
	},
});
