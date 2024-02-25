import m from 'mithril';

import { ImportExport } from 'js/types/import-export';
import * as API from 'js/core/api';
import store from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import Loader from 'js/ui/shoelace/loader';
import Modal from 'js/ui/shoelace/modal';
import Select from 'js/ui/shoelace/select';

import Config from 'js/ui/components/config/config';
import ConfigTypes from 'js/ui/components/config/types';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';

import { popPortal } from 'js/ui/portal';
import { error, success } from 'js/ui/toast';

type ImportExportProps = {
	endpoint: string;
	title: string;
	loadingMessage: string;
	verb: string;
	id?: string;
};

type ImportExportState = {
	attrs: ImportExportProps | null;
	imports: ImportExport[];
	selected: ImportExport | null;
	args: any[];
	loading: boolean;
};

export default (): m.Component<ImportExportProps> => {
	const state: ImportExportState = {
		attrs: null,
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
		API.exec(state.attrs?.endpoint + state.selected.rpcName, ...(state.attrs?.id ? [state.attrs.id, state.args] : [state.args]))
			.then(() => {
				success(`${state.attrs?.verb ?? ''} successful`);
				store.actions.loadAll(true).catch(error);
				popPortal();
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
			m('div.mt2', m(Button, { className: '.fr', intend: 'success', onClick: importData }, `${state.attrs?.verb ?? 'Do'} "${state.selected.name}"`)),
		]);
	};

	return {
		oninit({ attrs }) {
			state.attrs = attrs;

			API.exec<ImportExport[]>(attrs.endpoint)
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
					title: state.attrs?.title ?? 'Import Export',
					onClose: () => {
						popPortal();
					},
					loading: state.loading,
					loadingMessage: state.attrs?.loadingMessage ?? 'Loading... Please wait',
				},
				[
					m(
						'div.w5',
						m(Select, {
							keys: state.imports.map((i) => i.name),
							selected: state.selected?.name ?? '',
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
