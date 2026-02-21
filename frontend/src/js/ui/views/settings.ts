import m from 'mithril';
import { isEqual } from 'lodash-es';

import { css } from 'goober';

import Settings, { Commands, createEmptySettings } from 'js/types/settings';
import * as API from 'js/core/api';
import store, { printerTypes, settings } from 'js/core/store';

import Button from 'js/ui/shoelace/button';
import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';
import Select from 'js/ui/shoelace/select';

import Title from 'js/ui/components/atomic/title';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';
import FullscreenLoader from 'js/ui/components/portal/fullscreen-loader';
import { openPromptModal } from 'js/ui/components/modals/prompt';
import Base from 'js/ui/components/view-layout/base';
import PropertyEdit, { PropertyEditProps } from 'js/ui/components/view-layout/property-edit';
import PropertyHeader from 'js/ui/components/view-layout/property-header';

import { clearPortal, setPortal } from 'js/ui/portal';
import { dialogWarning, error, neutral, success } from 'js/ui/toast';

const containerClass = css`
	max-width: 1000px;
`;

type PrinterConfigPreset = Pick<Settings, 'printerType' | 'printerEndpoint' | 'printerWidth'>;

const PRINTER_CONFIGS_KEY = 'settings_printer_configs';

export default (): m.Component => {
	let settingsCopy: Settings = { ...createEmptySettings(), ...settings.value };
	let aiModels: string[] = [];
	let aiProviders: string[] = [];
	let aiModelSearch = '';
	let printerConfigs: Record<string, PrinterConfigPreset> = {};
	let selectedPrinterConfig = '';

	const onChangeSettings = (updated: Settings) => {
		settingsCopy = { ...settingsCopy, ...updated };
	};

	const onChangeCommands = (updated: Commands) => {
		settingsCopy = { ...settingsCopy, commands: updated };
	};

	const savePrinterConfigs = () => API.exec<void>(API.SET_KEY, PRINTER_CONFIGS_KEY, JSON.stringify(printerConfigs));

	const loadPrinterConfigs = () => {
		API.exec<string>(API.GET_KEY, PRINTER_CONFIGS_KEY)
			.then((configs) => {
				printerConfigs = JSON.parse(configs || '{}');
				if (selectedPrinterConfig && !printerConfigs[selectedPrinterConfig]) {
					selectedPrinterConfig = '';
				}
			})
			.catch(() => {
				printerConfigs = {};
			});
	};

	const persistCurrentPrinterConfig = (name: string) => {
		const cleaned = name.trim();
		if (cleaned.length === 0) {
			error('Please enter a config name');
			return;
		}

		const persist = () => {
			printerConfigs = {
				...printerConfigs,
				[cleaned]: {
					printerType: settingsCopy.printerType,
					printerEndpoint: settingsCopy.printerEndpoint,
					printerWidth: settingsCopy.printerWidth,
				},
			};
			selectedPrinterConfig = cleaned;

			savePrinterConfigs()
				.then(() => {
					success('Saved printer config');
				})
				.catch(error);
		};

		if (printerConfigs[cleaned]) {
			dialogWarning('This config already exists. Do you want to overwrite it?')
				.then(persist)
				.catch(() => {});
			return;
		}

		persist();
	};

	const saveCurrentPrinterConfig = () => {
		openPromptModal({
			title: 'Save Printer Config',
			label: 'Name',
			description: 'Enter a name for this printer config',
			value: selectedPrinterConfig,
			buttonText: 'Save',
			onSuccess: persistCurrentPrinterConfig,
		});
	};

	const applyPrinterConfig = (name: string) => {
		selectedPrinterConfig = name;
		const selected = printerConfigs[name];
		if (!selected) return;

		settingsCopy = {
			...settingsCopy,
			printerType: selected.printerType,
			printerEndpoint: selected.printerEndpoint,
			printerWidth: selected.printerWidth,
		};
	};

	const deletePrinterConfig = () => {
		if (!selectedPrinterConfig || !printerConfigs[selectedPrinterConfig]) {
			return;
		}

		dialogWarning('Are you sure you want to delete this config?').then(() => {
			delete printerConfigs[selectedPrinterConfig];
			selectedPrinterConfig = '';
			savePrinterConfigs()
				.then(() => success('Deleted printer config'))
				.catch(error);
		});
	};

	const applySettings = () => {
		if (settingsCopy.syncEnabled && !settings.value.syncEnabled) {
			neutral('Syncing is enabled. Please restart the application to apply the changes!');
		}
		settings.set(settingsCopy);
	};

	const testPrint = () => {
		API.exec(
			API.PRINT,
			`
			<h1 style="font-size: 2rem;">Test print</h1>
			<p style="font-size: 1.5rem;">Thank you for using Sales & Dungeons <3</p>
			<pre style="font-size: 1.5rem;">${JSON.stringify(
				{
					...settings.value,
					aiApiKey: 'redacted',
					syncKey: 'redacted',
				},
				null,
				2,
			)}</pre>
			`,
		)
			.then(() => {
				success('Test print sent!');
			})
			.catch(error);
	};

	const fetchAiProviders = () => {
		API.exec<string[]>(API.AI_PROVIDERS)
			.then((providers) => {
				aiProviders = providers;
				m.redraw();
			})
			.catch(error);
	};

	const fetchAiModels = () => {
		if (settingsCopy.aiProvider === '') return;

		API.exec<string[]>(API.AI_MODELS, settingsCopy.aiProvider)
			.then((models) => {
				aiModels = models.sort((a, b) => a.localeCompare(b));
				m.redraw();
			})
			.catch((err) => {
				error('Could not fetch AI models. retrying... (' + err + ')');
				setTimeout(fetchAiModels, 3000);
			});
	};

	const syncToCloud = () => {
		setPortal(FullscreenLoader, {
			attributes: {
				reason: 'Syncing to cloud...',
			},
		});
		API.exec(API.SYNC_LOCAL_TO_CLOUD)
			.then(() => {
				success('Synced to cloud! Reloading data...');
				store.actions.loadAll().then(() => {
					success('Reloaded data!');
				});
			})
			.catch(error)
			.finally(clearPortal);
	};

	const syncFromCloud = () => {
		setPortal(FullscreenLoader, {
			attributes: {
				reason: 'Syncing from cloud...',
			},
		});
		API.exec(API.SYNC_CLOUD_TO_LOCAL)
			.then(() => {
				success('Synced from cloud!');
			})
			.catch(error)
			.finally(clearPortal);
	};

	const clearPreviewImageCache = () => {
		setPortal(FullscreenLoader, {
			attributes: {
				reason: 'Clearing preview image cache...',
			},
		});
		API.exec<number>(API.CLEAR_PREVIEW_CACHE)
			.then((num) => {
				clearPortal();
				success(`Cleared ${num} preview images from cache!`);
			})
			.catch(error);
	};

	const clearAICache = () => {
		setPortal(FullscreenLoader, {
			attributes: {
				reason: 'Clearing AI cache...',
			},
		});
		API.exec<number>(API.CLEAR_AI_CACHE)
			.then((num) => {
				clearPortal();
				success(`Cleared ${num} AI results from cache!`);
			})
			.catch(error);
	};

	return {
		oninit() {
			fetchAiProviders();
			fetchAiModels();
			loadPrinterConfigs();
		},
		view() {
			const printerConfigNames = Object.keys(printerConfigs).sort((a, b) => a.localeCompare(b));
			const filteredAiModels = aiModels.filter((model) => model.toLowerCase().includes(aiModelSearch.trim().toLowerCase()));

			return m(
				Base,
				{
					title: m(Title, 'Settings'),
					active: 'settings',
					classNameContainer: '.pa3',
					rightElement: m(Flex, { gap: 2 }, [
						m(IconButton, { icon: 'print', intend: 'primary', onClick: testPrint, disabled: !isEqual(settingsCopy, settings.value) }, 'Test Print'),
						m(IconButton, { icon: 'checkmark-circle-outline', intend: 'success', onClick: applySettings }, 'Apply'),
					]),
				},
				m(
					Flex,
					{ justify: 'center', className: '.w-100' },
					m(
						`div.w-100.${containerClass}`,
						m('', [
							//
							// General
							m(PropertyHeader, {
								title: 'General',
								description: 'Various general settings',
								icon: 'settings',
							}), //
							m(PropertyEdit<Settings>, {
								properties: settingsCopy,
								annotations: {
									spellcheckerLanguages: {
										label: 'Spellchecker Languages',
										description: 'The languages that will be used for spellchecking (e.g. en-US, de, fr)',
										arrayType: 'string',
									},
									packageRepos: {
										label: 'Package Repositories',
										description: 'Custom repositories besides the default that will be used for installing packages',
										arrayType: 'string',
									},
								},
								show: ['spellcheckerLanguages', 'packageRepos'],
								onChange: onChangeSettings,
							} as PropertyEditProps<Settings>),
							//
							// Printer Commands
							m(PropertyHeader, {
								className: '.mt3',
								title: 'Printer',
								description: 'The main printer settings',
								icon: 'print',
							}), //
							m('div.pa2.mb3.bg-white.ba.br2.b--black-10.lh-copy', [
								m('div.f6.b.mb1', settingsCopy.printerType),
								printerTypes.value[settingsCopy.printerType] ?? '',
							]),
							m(PropertyEdit<Settings>, {
								properties: settingsCopy,
								annotations: {
									printerType: {
										label: 'Type',
										description: 'The type of printer you are using',
										customComponent: m(Select, {
											keys: Object.keys(printerTypes.value),
											selected: settingsCopy.printerType,
											onInput: (e) => {
												settingsCopy = { ...settingsCopy, printerType: e.value };
											},
										}),
									},
									printerEndpoint: {
										label: 'Endpoint',
										description:
											'The endpoint of the printer is a text represented identifier of the printer (e.g. Name, Serial Port, IP Address etc.)',
									},
									printerWidth: {
										label: 'Width',
										description: 'The width of the printer',
									},
								},
								show: ['printerType', 'printerEndpoint', 'printerWidth'],
								onChange: onChangeSettings,
							} as PropertyEditProps<Settings>),
							m(
								HorizontalProperty,
								{
									label: 'Saved Configs',
									description: 'Save and quickly switch printer type/endpoint/width combinations',
									centered: true,
									bottomBorder: true,
								},
								m(Flex, { gap: 2, items: 'center', className: '.w-100' }, [
									m(Select, {
										selected: selectedPrinterConfig,
										keys: printerConfigNames,
										onInput: (e) => applyPrinterConfig(e.value),
										clearable: true,
									}),
									m(IconButton, { icon: 'save', intend: 'primary', onClick: saveCurrentPrinterConfig }),
									m(IconButton, { icon: 'trash', intend: 'error', onClick: deletePrinterConfig, disabled: !selectedPrinterConfig }),
								]),
							),
							//
							// Printer Commands
							m(PropertyHeader, {
								className: '.mt3',
								title: 'Printer Commands',
								description: 'Fine tune your printer settings',
								icon: 'print',
							}), //
							m(PropertyEdit<Commands>, {
								properties: settingsCopy.commands,
								annotations: {
									cut: {
										label: 'Cut',
										description: 'Enable paper cut after printing',
									},
									explicitInit: {
										label: 'Explicit Init',
										description: 'Send an explicit init command before printing',
									},
									linesBefore: {
										label: 'Lines Before',
										description: 'Number of lines to send before printing',
									},
									linesAfter: {
										label: 'Lines After',
										description: 'Number of lines to send after printing',
									},
									useEscStar: {
										label: 'Use ESC *',
										description: 'Use ESC * instead of GS v 0 (use in case your printer outputs gibberish)',
									},
								},
								show: ['explicitInit', 'cut', 'linesBefore', 'linesAfter', 'useEscStar'],
								onChange: onChangeCommands,
							} as PropertyEditProps<Commands>),
							//
							// Image Chunking
							m(PropertyHeader, {
								className: '.mt3',
								title: 'Image Chunking',
								description: 'If your printer has a low print buffer you can chunk the print commands',
								icon: 'images',
							}), //
							m(PropertyEdit<Commands>, {
								properties: settingsCopy.commands,
								annotations: {
									splitPrinting: {
										label: 'Enable',
										description: 'Split the image into chunks',
									},
									splitHeight: {
										label: 'Height',
										description: 'Height of the chunks in pixels',
									},
									splitDelay: {
										label: 'Delay',
										description: 'Delay between chunks in seconds', // TODO: is it seconds?
									},
								},
								show: ['splitPrinting', 'splitHeight', 'splitDelay'],
								onChange: onChangeCommands,
							} as PropertyEditProps<Commands>),
							//
							// AI
							m(PropertyHeader, {
								className: '.mt3',
								title: 'AI Tools',
								description: 'Enhance generators with AI (experimental)',
								icon: 'planet',
							}), //
							m(PropertyEdit<Settings>, {
								properties: settingsCopy,
								annotations: {
									aiEnabled: {
										label: 'Enable',
										description: 'Enable or disable AI',
									},
									aiAlwaysAllow: {
										label: 'Always Allow',
										description: 'Enable AI by default without asking for confirmation. Use with caution!',
									},
									aiApiKey: {
										label: 'API Key',
										description: 'The API key for the AI service. This is used to calculate how much example data the AI can be presented with.',
									},
									aiContextWindow: {
										label: 'Context Window',
										description:
											'The context window for the AI service. This window is used to provide the AI with examples in case of the entry generator. Higher values should provide better results.',
									},
									aiMaxTokens: {
										label: 'Max Tokens',
										description:
											'The max tokens for the AI service. Higher values will allow the AI to generate more content. (common range: 300-10000)',
									},
								},
								show: ['aiEnabled', 'aiAlwaysAllow', 'aiApiKey', 'aiContextWindow', 'aiMaxTokens'],
								onChange: onChangeSettings,
							} as PropertyEditProps<Settings>),
							m(
								HorizontalProperty,
								{
									label: 'Provider',
									description: 'The AI provider to use',
									centered: true,
									bottomBorder: true,
								},
								m(Select, {
									selected: settingsCopy.aiProvider,
									keys: aiProviders,
									onInput: (e) => {
										aiModelSearch = '';
										settingsCopy = { ...settingsCopy, aiModel: '', aiCodingModel: '', aiProvider: e.value };
										fetchAiModels();
									},
								}),
							),
							aiModels.length === 0 || settingsCopy.aiProvider.startsWith('Custom')
								? null
								: [
										m(
											HorizontalProperty,
											{
												label: 'Model Filter',
												description: 'Filter the model dropdowns',
												centered: true,
												bottomBorder: true,
											},
											m(Input, {
												value: aiModelSearch,
												placeholder: 'Search models...',
												clearable: true,
												onChange: (val) => {
													aiModelSearch = val;
												},
											}),
										),
										m(
											HorizontalProperty,
											{
												label: 'Model',
												description: 'The AI model to use',
												centered: true,
												bottomBorder: true,
											},
											m(Flex, { direction: 'column', className: '.w-100' }, [
												m(Select, {
													selected: settingsCopy.aiModel,
													placeholder: 'Select a Model',
														keys: filteredAiModels,
														onInput: (e) => {
															settingsCopy = { ...settingsCopy, aiModel: e.value };
													},
												}),
											]),
										),
										m(
												HorizontalProperty,
												{
													label: 'Coding Model',
													description: 'The AI model to use for HTML/CSS/JS generation',
													centered: true,
													bottomBorder: true,
												},
												m(Select, {
													selected: settingsCopy.aiCodingModel,
													placeholder: 'Select a Coding Model',
													keys: filteredAiModels,
													onInput: (e) => {
														settingsCopy = { ...settingsCopy, aiCodingModel: e.value };
													},
												}),
											),
										],
								!settingsCopy.aiProvider.startsWith('Custom')
									? null
									: [
											m(
											HorizontalProperty,
											{
												label: 'Custom Model',
												description:
													'The AI model to use for your custom AI. Depending on the provider this can be a model name, file location or a model ID. Can be left blank if not applicable.',
												centered: true,
												bottomBorder: true,
											},
											m(Input, {
												value: settingsCopy.aiModel,
												onChange: (val) => {
													settingsCopy = { ...settingsCopy, aiModel: val };
												},
												}),
											),
										m(
											HorizontalProperty,
											{
												label: 'Coding Model',
												description: 'The AI model to use for HTML/CSS/JS generation',
												centered: true,
												bottomBorder: true,
											},
											m(Input, {
												value: settingsCopy.aiCodingModel,
												onChange: (val) => {
													settingsCopy = { ...settingsCopy, aiCodingModel: val };
												},
											}),
										),
										m(
											HorizontalProperty,
											{
												label: 'Custom URL',
												description: 'The URL of your custom OpenAI compatible API (e.g. http://localhost:1234)',
												centered: true,
												bottomBorder: true,
											},
											m(Input, {
												value: settingsCopy.aiUrl,
												onChange: (val) => {
													settingsCopy = { ...settingsCopy, aiUrl: val };
												},
											}),
										),
										],
						]),
						//
						// Cache
						m(PropertyHeader, {
							className: '.mt3',
							title: 'Cache',
							description: 'Control for the cache',
							icon: 'cube',
						}), //
						m(
							HorizontalProperty,
							{
								label: 'Clear AI Cache',
								description: 'Clear the AI cache. This will remove all cached AI data. This can be useful if you encounter issues with the AI.',
								bottomBorder: true,
								centered: true,
							},
							m(Button, { intend: 'error', onClick: clearAICache }, 'Clear AI Cache'),
						),
						m(
							HorizontalProperty,
							{
								label: 'Clear Image Cache',
								description:
									'Clear the preview image cache. This will remove all cached preview images. This can be useful if you encounter issues with the preview images.',
								bottomBorder: true,
								centered: true,
							},
							m(Button, { intend: 'error', onClick: clearPreviewImageCache }, 'Clear Preview Cache'),
						),
						//
						// Cloud Sync
						m(PropertyHeader, {
							className: '.mt3',
							title: 'Cloud Sync',
							description: 'Sync your data to the cloud (experimental feature)',
							icon: 'cloudy',
						}), //
						m(PropertyEdit<Settings>, {
							properties: settingsCopy,
							annotations: {
								syncKey: {
									label: 'Sync Key',
									description: 'The key to identify your data',
								},
								syncEnabled: {
									label: 'Enable Sync',
									description: 'Enable or disable sync',
								},
							},
							show: ['syncKey', 'syncEnabled'],
							onChange: onChangeSettings,
						} as PropertyEditProps<Settings>),
						m(
							HorizontalProperty,
							{
								label: 'Force Sync to Cloud',
								description:
									'Force a sync of local data with the cloud. If you enabled sync for the first time this will upload all your data to the cloud.',
								bottomBorder: true,
								centered: true,
							},
							m(Button, { intend: 'error', onClick: syncToCloud }, 'Start Sync'),
						),
						m(
							HorizontalProperty,
							{
								label: 'Force Sync from Cloud',
								description:
									'Force a sync of cloud data to the local data. If you stop wanting to sync this will download all your data from the cloud.',
								bottomBorder: true,
								centered: true,
							},
							m(Button, { intend: 'error', onClick: syncFromCloud }, 'Start Sync'),
						),
					),
				),
			);
		},
	};
};
