import m from "mithril";

import { css } from "goober";

import Settings, { Commands } from "js/types/settings";

import store, { printer, settings } from "js/core/store";

import * as API from "js/core/api";

import FullscreenLoader from "js/ui/components/portal/fullscreen-loader";
import Title from "js/ui/components/atomic/title";
import Flex from "js/ui/components/layout/flex";
import Base from "js/ui/components/view-layout/base";
import PropertyEdit, { PropertyEditProps } from "js/ui/components/view-layout/property-edit";
import PropertyHeader from "js/ui/components/view-layout/property-header";
import IconButton from "js/ui/spectre/icon-button";
import Select from "js/ui/spectre/select";
import HorizontalProperty from "js/ui/components/horizontal-property";
import Button from "js/ui/spectre/button";

import { error, neutral, success } from "js/ui/toast";

import { clearPortal, setPortal } from "js/ui/portal";

const containerClass = css`
	max-width: 1000px;
`;

export default (): m.Component => {
  let settingsCopy: Settings = { ...settings.value };

  const onChangeSettings = (updated: Settings) => {
    settingsCopy = { ...settingsCopy, ...updated };
  };

  const onChangeCommands = (updated: Commands) => {
    settingsCopy = { ...settingsCopy, commands: updated };
  };

  const applySettings = () => {
    if (settingsCopy.enableSync && !settings.value.enableSync) {
      neutral("Syncing is enabled. Please restart the application to apply the changes!");
    }
    settings.set(settingsCopy);
  };

  const syncToCloud = () => {
    setPortal(FullscreenLoader, {
      attributes: {
        reason: "Syncing to cloud..."
      }
    });
    API.exec(API.SYNC_LOCAL_TO_CLOUD).then(() => {
      success("Synced to cloud! Reloading data...");
      store.actions.loadAll().then(() => {
        success("Reloaded data!")
      })
    }).catch(error).finally(clearPortal);
  };

  const syncFromCloud = () => {
    setPortal(FullscreenLoader, {
      attributes: {
        reason: "Syncing from cloud..."
      }
    });
    API.exec(API.SYNC_CLOUD_TO_LOCAL).then(() => {
      success("Synced from cloud!");
    }).catch(error).finally(clearPortal);
  };

  return {
    view() {
      return m(
        Base,
        {
          title: m(Title, "Settings"), active: "settings", classNameContainer: ".pa3", rightElement:
            m(IconButton, { icon: "checkmark-circle-outline", intend: "success", onClick: applySettings }, "Apply")
        },
        m(Flex, { justify: "center", className: ".w-100" }, m(`div.w-100.${containerClass}`, m("", [
          //
          // General
          m(PropertyHeader, {
            title: "General",
            description: "Various general settings",
            icon: "settings"
          }), //
          m(PropertyEdit<Settings>, {
            properties: settingsCopy,
            annotations: {
              spellcheckerLanguages: {
                label: "Spellchecker Languages",
                description: "The languages that will be used for spellchecking (e.g. en-US, de, fr)",
                arrayType: "string"
              },
              packageRepos: {
                label: "Package Repositories",
                description: "Custom repositories besides the default that will be used for installing packages",
                arrayType: "string"
              }
            },
            show: ["spellcheckerLanguages", "packageRepos"],
            onChange: onChangeSettings
          } as PropertyEditProps<Settings>),
          //
          // Printer Commands
          m(PropertyHeader, {
            className: ".mt3",
            title: "Printer",
            description: "The main printer settings",
            icon: "print"
          }), //
          m(PropertyEdit<Settings>, {
            properties: settingsCopy,
            annotations: {
              printerType: {
                label: "Type",
                description: "The type of printer you are using",
                customComponent: m(Select, {
                  keys: Object.keys(printer.value).filter((k) => Object.keys(printer.value[k]).length > 0),
                  selected: settingsCopy.printerType,
                  onInput: (e) => {
                    settingsCopy = { ...settingsCopy, printerType: e.value };
                  }
                })
              },
              printerEndpoint: {
                label: "Endpoint",
                description: "The endpoint of the printer is a text represented identifier of the printer (e.g. Name, Serial Port, IP Address etc.)"
              },
              printerWidth: {
                label: "Width",
                description: "The width of the printer"
              }
            },
            show: ["printerType", "printerEndpoint", "printerWidth"],
            onChange: onChangeSettings
          } as PropertyEditProps<Settings>),
          //
          // Printer Commands
          m(PropertyHeader, {
            className: ".mt3",
            title: "Printer Commands",
            description: "Fine tune your printer settings",
            icon: "print"
          }), //
          m(PropertyEdit<Commands>, {
            properties: settingsCopy.commands,
            annotations: {
              cut: {
                label: "Cut",
                description: "Enable paper cut after printing"
              },
              explicitInit: {
                label: "Explicit Init",
                description: "Send an explicit init command before printing"
              },
              linesBefore: {
                label: "Lines Before",
                description: "Number of lines to send before printing"
              },
              linesAfter: {
                label: "Lines After",
                description: "Number of lines to send after printing"
              }
            },
            show: ["explicitInit", "cut", "linesBefore", "linesAfter"],
            onChange: onChangeCommands
          } as PropertyEditProps<Commands>),
          //
          // Image Chunking
          m(PropertyHeader, {
            className: ".mt3",
            title: "Image Chunking",
            description: "If your printer has a low print buffer you can chunk the print commands",
            icon: "images"
          }), //
          m(PropertyEdit<Commands>, {
            properties: settingsCopy.commands,
            annotations: {
              splitPrinting: {
                label: "Enable",
                description: "Split the image into chunks"
              },
              splitHeight: {
                label: "Height",
                description: "Height of the chunks in pixels"
              },
              splitDelay: {
                label: "Delay",
                description: "Delay between chunks in seconds" // TODO: is it seconds?
              }
            },
            show: ["splitPrinting", "splitHeight", "splitDelay"],
            onChange: onChangeCommands
          } as PropertyEditProps<Commands>),
          //
          // Cloud Sync
          m(PropertyHeader, {
            className: ".mt3",
            title: "Cloud Sync",
            description: "Sync your data to the cloud (experimental donator-only feature)",
            icon: "cloudy"
          }), //
          m(PropertyEdit<Settings>, {
            properties: settingsCopy,
            annotations: {
              syncKey: {
                label: "Sync Key",
                description: "The key to identify your data"
              },
              enableSync: {
                label: "Enable Sync",
                description: "Enable or disable sync"
              }
            },
            show: ["syncKey", "enableSync"],
            onChange: onChangeSettings
          } as PropertyEditProps<Settings>),
          m(HorizontalProperty, {
            label: "Force Sync to Cloud",
            description: "Force a sync of local data with the cloud. If you enabled sync for the first time this will upload all your data to the cloud.",
            bottomBorder: true,
            centered: true
          }, m(Button, { intend: "error", onClick: syncToCloud }, "Start Sync")),
          m(HorizontalProperty, {
            label: "Force Sync from Cloud",
            description: "Force a sync of cloud data to the local data. If you stop wanting to sync this will download all your data from the cloud.",
            bottomBorder: true,
            centered: true
          }, m(Button, { intend: "error", onClick: syncFromCloud }, "Start Sync"))
        ])))
      );
    }
  };
};
