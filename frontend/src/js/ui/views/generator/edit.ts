import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import { filterOutDynamicConfigValues } from 'js/types/config';
import Generator from 'js/types/generator';
import * as API from 'js/core/api';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Loader from 'js/ui/shoelace/loader';

import Tooltip from 'js/ui/components/atomic/tooltip';
import GeneratorEditor from 'js/ui/components/editor/generator';
import Flex from 'js/ui/components/layout/flex';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error, success } from 'js/ui/toast';

type EditGeneratorProps = {
	id: string;
};

export default (): m.Component<EditGeneratorProps> => {
	let state: Generator | null = null;
	let lastRenderedHTML = '';

	return {
		oninit({ attrs }) {
			API.exec<Generator>(API.GET_GENERATOR, attrs.id)
				.then((generator) => {
					state = generator;
				})
				.catch(error);
		},
		view(vnode) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: '/generator', label: 'Generators' },
							{ link: `/generator/${state ? buildId('generator', state) : ''}`, label: state ? state.name : m(Loader, { className: '.mh2' }) },
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
									API.exec<void>(API.SAVE_GENERATOR, {
										...state,
										config: filterOutDynamicConfigValues(state.config),
									})
										.then(() => {
											if (!state) return;
											m.route.set(`/generator/${buildId('generator', state)}`);
										})
										.catch(error);
								},
							},
							'Save',
						), //
						m(DividerVert),
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(IconButton, {
								className: '.mr2',
								intend: 'primary',
								icon: 'bug',
								size: 'sm',
								onClick: () => {
									openDevTools(document.body);
								},
							}),
						),
						m(
							Tooltip,
							{ content: 'Test Print' },
							m(IconButton, {
								intend: 'primary',
								icon: 'print',
								size: 'sm',
								onClick: () => {
									API.exec(API.PRINT, lastRenderedHTML)
										.then(() => success('Test print sent!'))
										.catch(error);
								},
							}),
						),
					]),
					active: 'generators',
				},
				state
					? m(GeneratorEditor, {
							generator: state,
							onChange: (generator) => {
								state = generator;
								m.redraw();
							},
							onRendered: (html) => {
								lastRenderedHTML = html;
							},
							editMode: true,
						})
					: m(Loader),
			);
		},
	};
};
