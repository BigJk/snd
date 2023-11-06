import m from 'mithril';
import Dropdown from 'js/ui/components/overlay/dropdown';
import Input from 'js/ui/spectre/input';
import Entry from 'js/types/entry';

type EntrySelectProps = {
	className?: string;
	entries: Entry[];
	onChange: (value: Entry) => void;
};

export default (): m.Component<EntrySelectProps> => {
	let search = '';

	const getEntries = (attrs: EntrySelectProps) => {
		let filtered = attrs.entries.filter((e) => {
			if (!e || !e.name || !e.id) {
				return false;
			}

			if (!search) {
				return true;
			}

			return e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase());
		});

		if (filtered.length === 0) {
			return m('div.item-pad.text-muted', 'No entry found');
		}

		return filtered.map((e) =>
			m(
				'div.item-pad.hover-bg-black-05.pointer',
				{
					onclick: () => {
						attrs.onChange(e);
					},
				},
				m('div', [m('div.b', e.name), m('div.text-muted', e.id)]), //
			),
		);
	};

	return {
		view({ attrs }) {
			return m(
				Dropdown,
				{
					content: m('div', getEntries(attrs)),
				},
				m(Input, {
					className: attrs.className,
					placeholder: 'Search...',
					onChange: (value: string) => {
						search = value;
					},
					value: search,
				}),
			);
		},
	};
};
