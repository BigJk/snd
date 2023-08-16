import m from 'mithril';

import { debounce, isEqual } from 'lodash-es';

import Template from 'js/types/template';

import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import PrintPreview from 'js/ui/components/print-preview';

type PrintPreviewTemplateProps = {
	className?: string;
	template: Template;
	it?: any;
	width: number;
};

export default (): m.Component<PrintPreviewTemplateProps> => {
	let lastProps: PrintPreviewTemplateProps | null = null;
	let loading = false;
	let lastRendered = '';

	const updateLastRendered = debounce((attrs: PrintPreviewTemplateProps) => {
		if (lastProps !== null && isEqual(lastProps.template, attrs.template) && isEqual(lastProps.it, attrs.it)) return;

		lastProps = attrs;
		loading = true;
		m.redraw();

		render(attrs.template.printTemplate, {
			it: attrs.it ?? attrs.template.skeletonData,
			settings: settings.value,
			images: attrs.template.images,
		})
			.then((html) => {
				lastRendered = html;
				m.redraw();
			})
			.catch(console.error)
			.finally(() => (loading = false));
	}, 500);

	return {
		oninit({ attrs }) {
			updateLastRendered(attrs);
		},
		onupdate({ attrs }) {
			updateLastRendered(attrs);
		},
		view({ attrs, key }) {
			return m(PrintPreview, {
				key,
				className: attrs.className,
				content: lastRendered,
				width: attrs.width,
				loading,
			});
		},
	};
};
