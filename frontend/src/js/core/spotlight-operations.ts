import m from 'mithril';

export type SpotlightOperation = {
	name: string;
	description: string;
	icon: string;
	onExecute: () => void;
};

export const Operations: SpotlightOperation[] = [
	{
		name: 'New Template',
		description: 'Create a new template',
		icon: 'add',
		onExecute: () => {},
	},
	{
		name: 'New Generator',
		description: 'Create a new generator',
		icon: 'add',
		onExecute: () => {},
	},
	{
		name: 'New Source',
		description: 'Create a new source',
		icon: 'add',
		onExecute: () => {},
	},
	{
		name: 'Open Dashboard',
		description: 'Open the dashboard',
		icon: 'home',
		onExecute: () => {
			m.route.set('/');
		},
	},
	{
		name: 'Open Settings',
		description: 'Open the settings',
		icon: 'settings',
		onExecute: () => {},
	},
	{
		name: 'Open Workshop',
		description: 'Open the workshop',
		icon: 'cart',
		onExecute: () => {},
	},
	{
		name: 'Open Devices',
		description: 'Open the devices',
		icon: 'outlet',
		onExecute: () => {
			m.route.set('/devices');
		},
	},
	{
		name: 'Open Data Sources',
		description: 'Open the data sources',
		icon: 'analytics',
		onExecute: () => {},
	},
	{
		name: 'Open Generators',
		description: 'Open the generators',
		icon: 'switch',
		onExecute: () => {},
	},
];
