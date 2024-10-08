import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import * as API from 'js/core/api';
import store from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import Modal from 'js/ui/shoelace/modal';

import BasicInfo from 'js/ui/components/editor/basic-info';

import { popPortal, pushPortal } from 'js/ui/portal';
import { error } from 'js/ui/toast';

type CreateSourceProps = {
	name: string;
	slug: string;
	author: string;
	description: string;
	copyrightNotice: string;
};

const dataSourceCreateModal = (): m.Component => {
	let state: CreateSourceProps = {
		name: '',
		slug: '',
		author: '',
		description: '',
		copyrightNotice: '',
	};

	return {
		view: () =>
			m(
				Modal,
				{ title: 'New Data Source', onClose: () => popPortal() },
				m('div', [
					m(BasicInfo, { className: '-', info: state, hideHeader: true, hidePreview: true, onChange: (info) => (state = info) }), //
					m(
						Button,
						{
							intend: 'success',
							className: '.mt2',
							onClick: () => {
								API.exec<string>(API.SAVE_SOURCE, state)
									.then((res) => {
										popPortal();
										store.actions.loadSources().catch(error);
										m.route.set(`/data-source/${buildId('source', { ...state, version: '' })}`);
									})
									.catch(error);
							},
						},
						'Create',
					),
				]),
			),
	};
};

export function openDataSourceCreateModal() {
	pushPortal(dataSourceCreateModal);
}
