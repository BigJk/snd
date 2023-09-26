import m from 'mithril';

import { buildId } from 'js/types/basic-info';

import { sources } from 'js/core/store';

import Select from 'js/ui/spectre/select';

import Config from 'js/ui/components/config/config';

export default {
	name: 'Data Source',
	default: () => ({
		selected: '',
	}),
	view: () => {
		return {
			view: ({ attrs }) => {
				const value = attrs.value as {
					selected: string;
				};

				// @ts-ignore
				return m(Select, {
					selected: value.selected,
					keys: sources.value.map((s) => buildId('source', s)),
					name: sources.value.map((s) => `${s.name} (${s.author})`),
					onInput: (e: any) => attrs.onChange({ ...value, selected: e.target.value }),
				});
			},
		};
	},
} as Config;
