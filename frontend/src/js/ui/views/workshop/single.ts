import m from 'mithril';

import PublicList from 'js/types/public-list';
import * as API from 'js/core/api';

import Input from 'js/ui/shoelace/input';

import Icon from 'js/ui/components/atomic/icon';
import Title from 'js/ui/components/atomic/title';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import WorkshopBox from 'js/ui/components/workshop-box';

import { error } from 'js/ui/toast';

type WorkshopProps = {
	id: string;
};

type WorkshopState = {
	list: PublicList | null;
	search: string;
};

export default (): m.Component<WorkshopProps> => {
	const state: WorkshopState = {
		list: null,
		search: '',
	};

	const fetchPackageRepos = (attrs: WorkshopProps) => {
		API.exec<PublicList[]>(API.GET_PUBLIC_LIST)
			.then((packageRepos) => {
				state.list = packageRepos.find((pr) => pr.name === atob(attrs.id)) ?? null;
			})
			.catch(error);
	};

	const search = () =>
		m('div.bg-white.mb3.br2.ba.b--black-10.pa3', [
			m('div.f8.fw5.ttu.mb3.text-muted', 'What are you looking for?'),
			m(Flex, { items: 'center' }, [
				m(Icon, { icon: 'search', className: '.mr3', size: 4 }), //
				m(Input, {
					value: state.search,
					placeholder: 'Search generators...',
					className: '.f6',
					minimal: true,
					onChange: (value) => {
						state.search = value;
					},
				}),
			]),
		]);

	const authorGroupTitle = (author: string) =>
		m('div', [
			m('div.text-muted.f8.fw5.ttu.mb1', 'Repos by'), //
			m(Title, author), //
		]);

	const repoCount = (length: number) => m('div.f8.fw5.ttu.mb1.text-muted', `${length} Repos`);

	const reposByAuthor = (attrs: WorkshopProps) =>
		state.list?.entries
			.filter((pl) => {
				if (state.search === '') {
					return true;
				}
				return (
					pl.author.toLowerCase().includes(state.search.toLowerCase()) || pl.repos.some((r) => r.toLowerCase().includes(state.search.toLowerCase()))
				);
			})
			.map((pl) =>
				m('div.bg-white.br2.ph3.mb3.ba.b--black-10', [
					m(Flex, { justify: 'between', className: '.mv3.bb.b--black-10.pb3' }, [
						authorGroupTitle(pl.author), //
						repoCount(pl.repos.length), //
					]), //
					m(
						Grid,
						{ className: '.mb3', minWidth: '350px', maxWidth: '1fr' },
						pl.repos
							.filter((e) => {
								if (state.search === '') {
									return true;
								}
								return e.toLowerCase().includes(state.search.toLowerCase());
							})
							.map((e) => m(WorkshopBox, { repo: e, onClick: () => m.route.set(`/workshop/${attrs.id}/${btoa(e)}`) })),
					),
				]),
			);

	return {
		oncreate({ attrs }) {
			fetchPackageRepos(attrs);
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [{ link: '/workshop', label: 'Workshop' }, { label: state.list === null ? '' : state.list.name }],
					}),
					active: 'workshop',
					classNameContainer: '.h-100.pa3',
				},
				m('div', [search(), reposByAuthor(attrs)]),
			);
		},
	};
};
