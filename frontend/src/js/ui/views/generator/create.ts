import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Generator, { createEmptyGenerator } from 'js/types/generator';

import * as API from 'js/core/api';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

import GeneratorEditor from 'js/ui/components/editor/generator';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error } from 'js/ui/toast';

export default (): m.Component => {
	let state: Generator | null = createEmptyGenerator();

	return {
		view(vnode) {
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
									API.exec<void>(API.SAVE_GENERATOR, state)
										.then(() => {
											if (!state) return;
											m.route.set(`/generator`);
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
