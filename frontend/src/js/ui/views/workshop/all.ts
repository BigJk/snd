import m from 'mithril';

import PublicList from 'src/js/types/public-list';
import * as API from 'js/core/api';

import IconButton from 'src/js/ui/spectre/icon-button';

import Title from 'js/ui/components/atomic/title';
import Base from 'js/ui/components/view-layout/base';
import HorizontalProperty from 'src/js/ui/components/horizontal-property';
import CenterContainer from 'src/js/ui/components/layout/center-container';
import Flex from 'src/js/ui/components/layout/flex';
import PropertyHeader from 'src/js/ui/components/view-layout/property-header';

import { error } from 'js/ui/toast';

type WorkshopState = {
	publicLists: PublicList[];
};

export default (): m.Component => {
	const state: WorkshopState = {
		publicLists: [],
	};

	const fetchPackageRepos = () => {
		API.exec<PublicList[]>(API.GET_PUBLIC_LIST)
			.then((packageRepos) => (state.publicLists = packageRepos))
			.catch(error);
	};

	return {
		oncreate() {
			fetchPackageRepos();
		},
		view() {
			return m(
				Base,
				{
					title: m(Title, 'Workshop'),
					active: 'workshop',
					classNameContainer: '.pa3',
				},
				m('div', [
					m(CenterContainer, [
						m(PropertyHeader, { title: 'Public Lists', description: 'Lists of available package repository.', icon: 'basket' }),
						state.publicLists.map((pl) =>
							m(
								HorizontalProperty,
								{ label: pl.name, description: pl.description, bottomBorder: true, centered: true },
								m(
									Flex,
									{ justify: 'end' },
									m(IconButton, { intend: 'primary', icon: 'link', onClick: () => m.route.set(`/workshop/${btoa(pl.name)}`) }, 'Browse'),
								),
							),
						),
					]),
				]),
			);
		},
	};
};
