import m from 'mithril';
import Modal from 'js/ui/spectre/modal';
import { popPortal, pushPortal } from 'js/ui/portal';
import BasicInfo from 'js/ui/components/editor/basic-info';
import Button from 'js/ui/spectre/button';
import * as API from 'js/core/api';
import { error } from 'js/ui/toast';
import store from 'js/core/store';
import { buildId } from 'js/types/basic-info';

type CreateSourceProps = {
	name: string;
	slug: string;
	author: string;
	description: string;
};

const dataSourceCreateModal = (): m.Component => {
	let state: CreateSourceProps = {
		name: '',
		slug: '',
		author: '',
		description: '',
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
