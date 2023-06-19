import m from "mithril";

import { css } from "goober";

import Settings, { Commands } from "js/types/settings";

import store, { settings, printer } from "js/core/store";

import Title from "js/ui/components/atomic/title";
import Flex from "js/ui/components/layout/flex";
import Base from "js/ui/components/view-layout/base";
import PropertyEdit, { PropertyEditProps } from "js/ui/components/view-layout/property-edit";
import PropertyHeader from "js/ui/components/view-layout/property-header";
import IconButton from "js/ui/spectre/icon-button";
import Select from "js/ui/spectre/select";

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
    settings.set(settingsCopy);
  }

  return {
    view() {
      return m(
        Base,
        {
          title: m(Title, "Settings"), active: "settings", classNameContainer: ".pa3", rightElement:
            m(IconButton, { icon: 'checkmark-circle-outline', intend: "success", onClick: applySettings }, "Apply")
        },
        m(Flex, { justify: "center", className: ".w-100" }, m(`div.w-100.${containerClass}`, m("", [
          //
          // Printer Commands
          m(PropertyHeader, {
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
                  },
                })
              },
              printerEndpoint: {
                label: "Endpoint",
                description: "The endpoint of the printer is a text represented identifier of the printer (e.g. Name, Serial Port, IP Address etc.)",
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
            description: "Sync your data to the cloud (donator-only feature)",
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
          } as PropertyEditProps<Settings>)
        ])))
      );
    }
  };
};
