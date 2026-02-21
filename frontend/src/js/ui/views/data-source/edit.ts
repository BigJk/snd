import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import DataSource from 'js/types/data-source';
import * as API from 'js/core/api';
import store from 'js/core/store';

import IconButton from 'js/ui/shoelace/icon-button';
import Loader from 'js/ui/shoelace/loader';

import BasicInfo from 'js/ui/components/editor/basic-info';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error } from 'js/ui/toast';

type EditDataSourceProps = {
	id: string;
};

export default (): m.Component<EditDataSourceProps> => {
	let state: DataSource | null = null;
	let fixedAuthor = '';
	let fixedSlug = '';

	return {
		oninit({ attrs }) {
			API.exec<DataSource>(API.GET_SOURCE, attrs.id)
				.then((source) => {
					state = source;
					fixedAuthor = source.author;
					fixedSlug = source.slug;
				})
				.catch(error);
		},
		view() {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: '/data-source', label: 'Data Sources' },
							{ link: `/data-source/${state ? buildId('source', state) : ''}`, label: state ? state.name : m(Loader, { className: '.mh2' }) },
							{ label: 'Edit' },
						],
					}),
					rightElement: m(Flex, { items: 'center' }, [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {
									if (!state) return;
									const updated = {
										...state,
										author: fixedAuthor,
										slug: fixedSlug,
									};
									API.exec<void>(API.SAVE_SOURCE, updated)
										.then(() => {
											store.actions.loadSources().catch(error);
											m.route.set(`/data-source/${buildId('source', updated)}`);
										})
										.catch(error);
								},
							},
							'Save',
						),
					]),
					active: 'data-sources',
				},
				state
					? m(BasicInfo, {
							className: '.h-100',
							info: state,
							onChange: (next) => {
								state = { ...state!, ...next, author: fixedAuthor, slug: fixedSlug };
							},
							hide: ['author', 'slug'],
						})
					: m(Loader),
			);
		},
	};
};
