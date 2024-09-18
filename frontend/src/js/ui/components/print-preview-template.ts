import m from 'mithril';
import { cloneDeep, debounce, isEqual } from 'lodash-es';

import Entry from 'js/types/entry';
import Generator, { seed } from 'js/types/generator';
import Template from 'js/types/template';
import * as API from 'js/core/api';
import store, { settings } from 'js/core/store';
import { addEntryMeta, containsAi, render } from 'js/core/templating';

import Checkbox from 'js/ui/shoelace/checkbox';
import IconButton from 'js/ui/shoelace/icon-button';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import PrintPreview from 'js/ui/components/print-preview';

export type PrintPreviewError = {
	line: number;
	column: number;
	error: string;
};

export type PrintPreviewTemplateProps = {
	className?: string;
	template?: Template;
	generator?: Generator;
	useListTemplate?: boolean;
	it?: any;
	entry?: Entry;
	config?: any;
	hideAiNotice?: boolean;
	width?: number;
	onRendered?: (html: string) => void;
	onError?: (error: PrintPreviewError[]) => void;
	onMessage?: (type: string, data: any) => void;
};

export default (): m.Component<PrintPreviewTemplateProps> => {
	let lastProps: PrintPreviewTemplateProps | null = null;
	let loading = false;
	let lastRendered = '';
	let aiEnabled = settings.value.aiAlwaysAllow;
	let allowReRender = 0;

	const getTemplate = (attrs: PrintPreviewTemplateProps) => {
		if (attrs.template) {
			if (attrs.useListTemplate) {
				return attrs.template.listTemplate;
			}
			return attrs.template.printTemplate;
		}
		return attrs.generator?.printTemplate;
	};

	const updateLastRendered = debounce((attrs: PrintPreviewTemplateProps) => {
		if (
			!allowReRender &&
			lastProps !== null &&
			isEqual(lastProps.template, attrs.template) &&
			isEqual(lastProps.it, attrs.it) &&
			isEqual(lastProps.generator, attrs.generator) &&
			isEqual(lastProps.config, attrs.config) &&
			isEqual(lastProps.entry, attrs.entry)
		) {
			return;
		}

		allowReRender--;
		if (allowReRender < 0) {
			allowReRender = 0;
		}

		lastProps = cloneDeep(attrs);
		loading = true;
		m.redraw();

		if (attrs.template === null && attrs.generator === null) return;
		const printTemplate = getTemplate(attrs);
		const it = addEntryMeta(attrs.entry ?? null, attrs.it) ?? addEntryMeta(null, attrs.template?.skeletonData);

		render(printTemplate ?? '', {
			it: it ?? {},
			config: attrs.config ?? {},
			sources: attrs.generator?.dataSources ?? attrs.template?.dataSources ?? [],
			settings: settings.value,
			images: attrs.template?.images ?? attrs.generator?.images ?? {},
			aiEnabled: aiEnabled,
		})
			.then((html) => {
				lastRendered = html;

				if (aiEnabled) {
					lastRendered += `<!-- ${seed()} -->`;
				}

				if (attrs.onRendered) attrs.onRendered(html);
				if (attrs.onError) attrs.onError([]);
			})
			.catch((err) => {
				console.error(err);
				if (attrs.onError) attrs.onError([err]);
			})
			.finally(() => {
				loading = false;
				m.redraw();
			});
	}, 500);

	return {
		oninit({ attrs }) {
			updateLastRendered(attrs);
		},
		onupdate({ attrs }) {
			updateLastRendered(attrs);
		},
		view({ attrs, key }) {
			const aiPresent = containsAi(getTemplate(attrs) ?? '');

			return m(
				PrintPreview,
				{
					key,
					className: attrs.className,
					content: lastRendered,
					width: attrs.width ?? 320,
					onMessage: attrs.onMessage,
					loading,
				},
				aiPresent && !attrs.hideAiNotice && settings.value.aiEnabled
					? m(
							'div.absolute.bottom-0.left-0.w-100.pa2',
							m(
								'div.pa2.bg-white.br2.ba.b--black-20.f7.light-shadow.no-input',
								m(Flex, { justify: 'between', items: 'center' }, [
									m(Flex, { gap: 2, items: 'center' }, [
										m(Icon, { icon: 'planet' }), //
										m('div', [
											m('div.ttu.f8.fw6', 'AI Content'), //
											m('div.f8.o-50', 'Execution requires permission!'),
										]),
									]),
									m(Flex, { gap: 2, items: 'center' }, [
										m(
											Tooltip,
											{ content: 'Allow' },
											m(Checkbox, {
												checked: aiEnabled,
												onChange: (val) => {
													aiEnabled = val;
													if (aiEnabled) {
														if (attrs.generator && attrs.config.seed) {
															store.actions.setAIToken(attrs.config.seed);
														} else {
															store.actions.setRandomAIToken();
														}
													}
													allowReRender = 1;
												},
											}),
										),
										aiEnabled
											? m(
													Tooltip,
													{ content: 'Re-Roll' },
													m(
														IconButton,
														{
															icon: 'refresh',
															size: 'sm',
															intend: 'primary',
															onClick: () => {
																API.exec(API.AI_INVALIDATE_CACHE, store.value.ai.token)
																	.then(() => {
																		allowReRender = 1;
																		m.redraw();
																	})
																	.catch(console.error);
															},
														},
														'',
													),
											  )
											: null,
									]),
								]),
							),
					  )
					: null,
			);
		},
	};
};
