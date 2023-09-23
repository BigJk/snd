import m from 'mithril';

import { debounce, isEqual } from 'lodash-es';

import Generator from 'js/types/generator';
import Template from 'js/types/template';

import { settings } from 'js/core/store';
import { containsAi, render } from 'js/core/templating';

import Button from 'js/ui/spectre/button';

import Flex from 'js/ui/components/layout/flex';
import PrintPreview from 'js/ui/components/print-preview';

type PrintPreviewTemplateProps = {
	className?: string;
	template?: Template;
	generator?: Generator;
	it?: any;
	config?: any;
	hideAiNotice?: boolean;
	width: number;
};

export default (): m.Component<PrintPreviewTemplateProps> => {
	let lastProps: PrintPreviewTemplateProps | null = null;
	let loading = false;
	let lastRendered = '';
	let enableAi = false;

	const updateLastRendered = debounce((attrs: PrintPreviewTemplateProps) => {
		if (!enableAi && lastProps !== null && isEqual(lastProps.template, attrs.template) && isEqual(lastProps.it, attrs.it)) return;

		lastProps = attrs;
		loading = true;
		m.redraw();

		if (attrs.template === null && attrs.generator === null) return;
		const printTemplate = attrs.template?.printTemplate ?? attrs.generator?.printTemplate;
		const it = attrs.it ?? attrs.template?.skeletonData;

		render(printTemplate ?? '', {
			it: it ?? {},
			config: attrs.config ?? {},
			settings: settings.value,
			images: attrs.template?.images ?? attrs.generator?.images ?? {},
			enableAi: enableAi,
		})
			.then((html) => {
				lastRendered = html;
			})
			.catch(console.error)
			.finally(() => {
				loading = false;
				m.redraw();
			});

		enableAi = false;
	}, 500);

	return {
		oninit({ attrs }) {
			updateLastRendered(attrs);
		},
		onupdate({ attrs }) {
			updateLastRendered(attrs);
		},
		view({ attrs, key }) {
			const aiPresent = containsAi(attrs.template?.printTemplate ?? attrs.generator?.printTemplate ?? '');

			return m(
				PrintPreview,
				{
					key,
					className: attrs.className,
					content: lastRendered,
					width: attrs.width,
					loading,
				},
				aiPresent && !attrs.hideAiNotice
					? m(
							'div.absolute.bottom-0.left-0.w-100.pa2',
							m(
								'div.pa2.bg-white-30.br2.ba.b--black-10.f7',
								m(Flex, { justify: 'between', items: 'center' }, [
									'AI Content',
									m(
										Button,
										{
											size: 'sm',
											intend: 'primary',
											onClick: () => {
												enableAi = true;
												console.log(enableAi);
											},
										},
										'Allow Once'
									),
								])
							)
					  )
					: null
			);
		},
	};
};
