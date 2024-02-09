import m from 'mithril';

import Loader from 'js/ui/spectre/loader';
import Flex from 'js/ui/components/layout/flex';

export type FullscreenLoaderProps = {
	className?: string;
	reason?: string;
};

export default (): m.Component<FullscreenLoaderProps> => ({
	view({ attrs }) {
		return m(Flex, { direction: 'column', justify: 'center', items: 'center' }, [
			m(Loader, { big: true }), //
			m('div.mt2.text-muted', attrs.reason ?? 'Loading...'),
		]);
	},
});
