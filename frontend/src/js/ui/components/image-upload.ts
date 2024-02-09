import m from 'mithril';

import * as API from 'js/core/api';
import guid from 'js/core/guid';

import Button from 'js/ui/spectre/button';
import Input from 'js/ui/spectre/input';
import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

type ImageUploadProps = {
	className?: string;
	height?: number;
	onUpload?: (name: string, base: string) => void;
};

export default (): m.Component<ImageUploadProps> => {
	let id = guid();
	let url = '';

	return {
		view({ attrs }) {
			return m(
				`div.w-100${attrs.className ?? ''}`,
				m(Flex, { className: '.w-100', direction: 'column', items: 'center' }, [
					//
					// Upload from computer
					m(
						'label.pointer.db.h-100.w-100.ba.bw1.br2.b--dashed.b--col-primary-muted.bg-black-05',
						{ style: { height: attrs.height ? attrs.height + 'px' : '250px' }, for: id },
						[
							m(Flex, { className: '.w-100.h-100', justify: 'center', items: 'center', direction: 'column' }, [
								m(Icon, { icon: 'document', size: 2, className: '.mb3' }),
								m('div.fw5', 'Select image from your computer'),
							]), //
						],
					), //
					m(`input.dn#${id}`, {
						type: 'file',
						onchange: (e: Event) => {
							let files = (e.target as HTMLInputElement).files;
							if (!files) return;

							for (let i = 0, f; (f = files[i]); i++) {
								if (!f.type.match('image.*')) {
									continue;
								}

								let reader = new FileReader();
								reader.onload = ((name) => (e) => {
									if (!e.target) return;
									if (attrs.onUpload) attrs.onUpload(name, e.target.result as string);
									m.redraw();
								})(f.name);
								reader.readAsDataURL(f);
							}
						},
					}),
					//
					// Divider
					m(Icon, { icon: 'more', size: 3, className: '.mv3.o-50' }),
					//
					// Upload from URL
					m('div.db.h-100.w-100.ba.bw1.br2.b--dashed.b--col-primary-muted.bg-black-05.pa3', [
						m('div.tc.mb3.fw5', 'Download from URL'),
						m(Flex, [
							m(Input, { className: '.w-100', placeholder: 'https://example.com/image.png', value: url }), //
							m(
								Button,
								{
									className: '.ml2',
									intend: 'primary',
									onClick: () => {
										if (url.length === 0) return;

										API.exec<string>(API.FETCH_IMAGE, url).then((base) => {
											if (attrs.onUpload) attrs.onUpload(guid(), base);
											m.redraw();
										});
									},
								},
								'Download',
							),
						]),
					]), //
				]),
			);
		},
	};
};
