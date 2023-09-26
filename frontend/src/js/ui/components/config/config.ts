import m from 'mithril';

export type ConfigProps = {
	value: any;
	onChange: (value: any) => void;
	inEdit?: boolean;
};

export type Config = {
	name: string;
	default: () => any;
	view: () => m.Component<ConfigProps>;
};

export default Config;
