import m from 'mithril';
import Dropdown from 'js/ui/components/atomic/dropdown';
import Input from 'js/ui/spectre/input';
import { sources } from 'js/core/store';
import { buildId } from 'js/types/basic-info';
import Flex from 'js/ui/components/layout/flex';
import Icon from 'js/ui/components/atomic/icon';

type SourceSelectProps = {
	sources: string[];
	onChange: (value: string[]) => void;
};

export default (): m.Component<SourceSelectProps> => {
	let search = '';

	return {
		view({ attrs }) {
			return m(
				Dropdown,
				{
					content: m(
						'div',
						sources.value
							.filter((s) => {
								if (attrs.sources.includes(buildId('source', s))) {
									return false;
								}

								if (!search) {
									return true;
								}

								return s.name.toLowerCase().includes(search.toLowerCase()) || buildId('source', s).toLowerCase().includes(search.toLowerCase());
							})
							.map((s) =>
								m(
									'div.item-pad.hover-bg-black-05.pointer',
									{
										onclick: () => {
											if (!attrs.sources.includes(buildId('source', s))) {
												attrs.onChange([...attrs.sources, buildId('source', s)]);
											}
										},
									},
									m(Flex, { items: 'center', gap: 2 }, [
										m(Icon, { icon: 'analytics', size: 4 }),
										m('div', [m('div.b', s.name), m('div.text-muted', buildId('source', s))]), //
									]),
								),
							),
					),
				},
				m(Input, {
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
