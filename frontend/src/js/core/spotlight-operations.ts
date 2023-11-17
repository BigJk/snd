import m from 'mithril';
import { openDataSourceCreateModal } from 'js/ui/components/modals/create-source';

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
		onExecute: () => {
			m.route.set('/template/create');
		},
	},
	{
		name: 'New Generator',
		description: 'Create a new generator',
		icon: 'add',
		onExecute: () => {
			m.route.set('/generators/create');
		},
	},
	{
		name: 'New Source',
		description: 'Create a new source',
		icon: 'add',
		onExecute: () => {
			m.route.set('/data-source');
			setTimeout(() => openDataSourceCreateModal(), 300);
		},
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
		name: 'Open Templates',
		description: 'Open the templates page',
		icon: 'list-box',
		onExecute: () => {
			m.route.set('/template');
		},
	},
	{
		name: 'Open Settings',
		description: 'Open the settings',
		icon: 'settings',
		onExecute: () => {
			m.route.set('/settings');
		},
	},
	{
		name: 'Open Workshop',
		description: 'Open the workshop',
		icon: 'cart',
		onExecute: () => {
			m.route.set('/workshop');
		},
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
		onExecute: () => {
			m.route.set('/data-source');
		},
	},
	{
		name: 'Open Generators',
		description: 'Open the generators',
		icon: 'switch',
		onExecute: () => {
			m.route.set('/generators');
		},
	},
];
