import { dataSourceId } from '/js/core/model-helper';
import store from '/js/core/store';

import { Select } from '/js/ui/components/index';

export default {
	name: 'Data Source',
	defaultValue: () => ({
		selected: '',
	}),
	view: () => ({
		oninit() {},
		view(vnode) {
			return (
				<div>
					<Select
						label={vnode.attrs.label}
						keys={store.data.sources?.map(dataSourceId)}
						names={store.data.sources?.map((s) => `${s.name} (${s.author})`)}
						selected={vnode.attrs.value.selected}
						oninput={(e) => vnode.attrs.oninput({ ...vnode.attrs.value, selected: e.target.value })}
					/>
				</div>
			);
		},
	}),
};
