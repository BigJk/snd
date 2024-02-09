import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Generator, { createEmptyGenerator } from 'js/types/generator';
import * as API from 'js/core/api';
import store from 'js/core/store';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';
import GeneratorEditor from 'js/ui/components/editor/generator';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import { error } from 'js/ui/toast';

type GeneratorCreateProps = {
	id?: string;
};

export default (): m.Component<GeneratorCreateProps> => {
	let state: Generator | null = createEmptyGenerator();

	return {
		oninit({ attrs }) {
			if (attrs.id) {
				API.exec<Generator>(API.GET_GENERATOR, attrs.id)
					.then((generator) => {
						state = generator;
					})
					.catch(error);
			}
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: '/generator', label: 'Templates' },
							{ link: `/generator/${state ? buildId('generator', state) : ''}`, label: state ? state.name : m(Loader, { className: '.mh2' }) },
							{ label: 'Edit' },
						],
					}),
					rightElement: [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {
									if (!state) return;
									if (attrs.id && buildId('generator', state) === attrs.id) {
										error('You cannot duplicate a generator with the same slug as the original.');
										return;
									}
									API.exec<void>(API.SAVE_GENERATOR, state)
										.then(() => {
											if (!state) return;

											if (attrs.id) {
												// If we are duplicating a generator, we need to copy the entries.
												API.exec<void>(API.COPY_ENTRIES, attrs.id, buildId('generator', state))
													.then(() => {
														if (!state) return;
														m.route.set(`/generator/${buildId('generator', state)}`);
														store.actions.loadGenerators();
													})
													.catch(error);
											} else {
												m.route.set(`/generator/${buildId('generator', state)}`);
												store.actions.loadGenerators();
											}
										})
										.catch(error);
								},
							},
							'Save',
						), //
					],
					active: 'generators',
				},
				state
					? m(GeneratorEditor, {
							generator: state,
							onChange: (generator) => {
								state = generator;
								m.redraw();
							},
					  })
					: m(Loader),
			);
		},
	};
};
