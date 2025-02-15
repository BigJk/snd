import m from 'mithril';

import { css } from 'goober';

import Icon from 'js/ui/components/atomic/icon';
import MiniHeader from 'js/ui/components/atomic/mini-header';
import Config, { ConfigProps } from 'js/ui/components/config/config';
import ImageUpload from 'js/ui/components/image-upload';
import Flex from 'js/ui/components/layout/flex';

const imageClass = css`
	max-width: 80px;
`;

export default {
    name: 'Image',
    default: () => '!IMAGE',
    view: (): m.Component<ConfigProps> => ({
        view: ({ attrs }) => [
            !attrs.inEdit ? null : m(MiniHeader, 'Default'),
            attrs.value && attrs.value.length > 0 && attrs.value.startsWith('data:')
                ? m(Flex, { items: 'center', justify: 'end' }, [
                    m(`img.br2.mr2.w-100.${imageClass}`, { src: attrs.value }), //
                    m(
                        Icon,
                        {
                            icon: 'trash',
                            size: 4,
                            className: '.col-error',
                            onClick: () => {
                                if (!attrs.onChange) return;
                                attrs.onChange("");
                            },
                        },
                        'Remove',
                    )
                ])
                : m(ImageUpload, {
                    height: 50,
                    compact: true,
                    className: '.mb3',
                    onUpload: (name, image) => {
                        if (!attrs.onChange) return;

                        m.request({
                            url: `/api/image-cache`,
                            method: 'POST',
                            body: image,
                        }).then(() => {
                            if (!attrs.onChange) return;
                            attrs.onChange(image);
                        });
                    },
                }),
        ],
    }),
} as Config;
