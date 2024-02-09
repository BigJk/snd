import m from 'mithril';
import { cloneDeep, debounce, isEqual } from 'lodash-es';

import Generator from 'js/types/generator';
import Template from 'js/types/template';
import store, { settings } from 'js/core/store';
import { containsAi, render } from 'js/core/templating';

import Button from 'js/ui/spectre/button';

import Icon from 'js/ui/components/atomic/icon';
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
	config?: any;
	hideAiNotice?: boolean;
	width?: number;
	onRendered?: (html: string) => void;
	onError?: (error: PrintPreviewError[]) => void;
};

export default (): m.Component<PrintPreviewTemplateProps> => {
	let lastProps: PrintPreviewTemplateProps | null = null;
	let loading = false;
	let lastRendered = '';
	let aiEnabled = false;

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
			!aiEnabled &&
			lastProps !== null &&
			isEqual(lastProps.template, attrs.template) &&
			isEqual(lastProps.it, attrs.it) &&
			isEqual(lastProps.generator, attrs.generator) &&
			isEqual(lastProps.config, attrs.config)
		) {
			return;
		}

		lastProps = cloneDeep(attrs);
		loading = true;
		m.redraw();

		if (attrs.template === null && attrs.generator === null) return;
		const printTemplate = getTemplate(attrs);
		const it = attrs.it ?? attrs.template?.skeletonData;

		render(printTemplate ?? '', {
			it: it ?? {},
			config: attrs.config ?? {},
			settings: settings.value,
			images: attrs.template?.images ?? attrs.generator?.images ?? {},
			aiEnabled: aiEnabled,
		})
			.then((html) => {
				lastRendered = html;
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

		aiEnabled = false;
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
									m(
										Button,
										{
											size: 'sm',
											intend: 'primary',
											onClick: () => {
												store.actions.setRandomAIToken();
												aiEnabled = true;
											},
										},
										'Allow or Re-Roll',
									),
								]),
							),
					  )
					: null,
			);
		},
	};
};
