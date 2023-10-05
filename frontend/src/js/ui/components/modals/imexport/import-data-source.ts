import m from 'mithril';

import { DataSourceImport } from 'js/types/import-data-source';

import * as API from 'js/core/api';
import store from 'js/core/store';

import Button from 'js/ui/spectre/button';
import Loader from 'js/ui/spectre/loader';
import Modal from 'js/ui/spectre/modal';
import Select from 'js/ui/spectre/select';

import Config from 'js/ui/components/config/config';
import ConfigTypes from 'js/ui/components/config/types';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';

import { clearPortal } from 'js/ui/portal';
import { error, success } from 'js/ui/toast';

type ImportDataState = {
	imports: DataSourceImport[];
	selected: DataSourceImport | null;
	args: any[];
	loading: boolean;
};

export default (): m.Component => {
	const state: ImportDataState = {
		imports: [],
		selected: null,
		args: [],
		loading: false,
	};

	const importData = () => {
		if (!state.selected) {
			return;
		}

		state.loading = true;
		API.exec(API.IMPORT_SOURCE + state.selected.rpcName, state.args)
			.then(() => {
				success('Import successful');
				store.actions.loadSources().catch(error);
				clearPortal();
			})
			.catch(error)
			.finally(() => {
				state.loading = false;
			});
	};

	const selectedArguments = () => {
		if (!state.selected) {
			return null;
		}

		return m(
			Flex,
			{ direction: 'column' },
			state.selected.arguments.map((arg, i) => {
				const type = (ConfigTypes as any)[arg.type] as Config | undefined;
				if (!type) {
					return null;
				}

				return m(
					HorizontalProperty,
					{
						label: arg.name,
						description: arg.description,
						bottomBorder: true,
						centered: true,
					},
					m(type.view, {
						value: state.args[i],
						onChange: (value: any) => {
							state.args[i] = value;
						},
					}),
				);
			}),
		);
	};

	const selected = () => {
		if (!state.selected) {
			return null;
		}

		return m(Flex, { direction: 'column', className: '.mt3.lh-copy.relative.overflow-auto' }, [
			m('div.ttu.f8.b.bb.b--black-05.pb2.mb2', 'Method'),
			m('div.pv2.ph3.br2.bg-black-05', [m('div.f5.mb1', state.selected.name), m('div.f7.text-muted', state.selected.description)]),
			m('div.ttu.f8.b.bb.b--black-05.pb2.mt3', 'Arguments'),
			selectedArguments(),
			m('div.mt2', m(Button, { className: '.fr', intend: 'success', onClick: importData }, `Import "${state.selected.name}"`)),
		]);
	};

	return {
		oninit() {
			API.exec<DataSourceImport[]>(API.GET_SOURCE_IMPORTS)
				.then((imports) => {
					state.imports = imports;
				})
				.catch(error);
		},
		view() {
			if (state.imports.length === 0) {
				return m(Loader);
			}
			return m(
				Modal,
				{
					icon: 'cloud-upload',
					width: state.selected ? 900 : 400,
					title: 'Import Data Source',
					onClose: () => {
						clearPortal();
					},
					loading: state.loading,
					loadingMessage: 'Importing... Please wait',
				},
				[
					m(
						'div.w5',
						m(Select, {
							keys: state.imports.map((i) => i.name),
							selected: state.selected?.name ?? null,
							onInput: (key) => {
								state.selected = state.imports.find((imp) => imp.name === key.value) ?? null;
								if (state.selected) {
									state.args = state.selected.arguments.map((a) => a.default);
								}
							},
						}),
					),
					selected(),
				],
			);
		},
	};
};
