![S&D Header](./data/readme_header.png)

----

<img align="right" width="120px" alt="Sales &amp; Dungeons" src="./data/preview.png">
<img width="100" alt="Sales &amp; Dungeons" src="./data/round_icon.png">

[![Discord](https://img.shields.io/discord/678654745803751579?label=discord)](https://discord.gg/5MUZEjc) [![GitHub Discussions](https://img.shields.io/github/discussions/BigJk/snd)](https://github.com/BigJk/snd/discussions) [![GitHub release (latest by date)](https://img.shields.io/github/v/release/BigJk/snd)](https://github.com/BigJk/snd/releases)

**Sales & Dungeons** — Thermal Printer as D&amp;D Utility.

With Sales & Dungeons you can create highly customizable handouts, quick reference and much more for your Dungeons and Dragons (or other PnP) Sessions.
Most Thermal Printer are small in size and can be taken with you and kept right at the gaming table. Use-cases range from printing out magic items, spells
or a letter that the group found to little character sheets of your players to use as DM note. The possibilities are nearly endless!

[Printer Setup](https://sales-and-dungeons.app/docs/printer/setup/) • [Tested Printer](https://sales-and-dungeons.app/docs/printer/models) • [Wiki](https://sales-and-dungeons.app/docs/intro)

**Important:** If you have trouble getting this to work it's best to drop by our [Discord](https://discord.gg/5MUZEjc).

![Screenshot](./data/screenshot.png)

![Screenshot Generator](./data/screenshot_gen.png)

## Features

- Works on
  - Windows
  - Mac (Intel, M1)
  - Linux (x64, ARM64)
  - Raspberry Pi (ARMv6, ARMv7)
  - Anything else go can be compiled on
- Extensive templating system through [Nunjucks](https://mozilla.github.io/nunjucks/)
- Extensive random generator system
- Various connection methods
  - Windows Direct Printing
  - Raw USB Printing
  - CUPS (Linux, Mac)
  - Serial
- Import & Export templates and data sources
- Fast access to external [data sources](https://sales-and-dungeons.app/docs/data-source/) like Open5e (instant access to SRD monsters, spells and more)
- Import data from other sources:
   - CSV
   - [FoundryVTT](https://foundryvtt.com/) Modules
   - Fight Club 5e XML Format
- Access Community Templates, Generators & Data Sources from within the App
- Edit templates in your favorite editor (e.g. Visual Studio Code) and get live preview

## Download 📁

You can find the latest version on the release page:
- https://github.com/BigJk/snd/releases

### Mac & Linux

- If you are on a unix system you can use the install script to download and install the latest version of Sales & Dungeons automatically
- The script will create a ``snd`` folder in your home directory
- To update to the newest version just run the command again. Your user data won't be deleted.

**Open your terminal and copy and paste the following command:**

```
curl -s https://raw.githubusercontent.com/BigJk/snd/master/install.sh | bash
```
   
### :whale: Docker

The headless version of Sales & Dungeons (using LibUSB) is also available via a docker container:
1. ``docker pull ghcr.io/bigjk/snd:master`` ([container](https://github.com/BigJk/snd/pkgs/container/snd))
2. ``docker run --expose 7123:7123 --device=/dev/bus/usb -v /some/place/to/persist:/app/userdata ghcr.io/bigjk/snd:master`` (change ``/some/place/to/persist`` to a folder where the user data should be persisted to)
3. Open ``http://127.0.0.1:7123`` in your favorite browser

<details><summary>Docker Compose Example</summary>

```
version: "3"
services:
  snd:
    image: ghcr.io/bigjk/snd:master
    ports:
      - "7123:7123"
    devices:
      - "/dev/bus/usb"
    volumes:
      - "/some/place/to/persist:/app/userdata"
```

</details>

## Printer Requirements

At the moment Sales & Dungeons only supports the [ESC/POS](https://en.wikipedia.org/wiki/ESC/P) (Epson Standard Code) control codes, which is still one of the most used control code set. Check if a thermal printer you are interested in mentions ESC/POS or Epson in the description or manual.

In general the rule of thumb is:
- Most cheap chinese thermal printer found on Amazon or AliExpress support it
- Most epson thermal printer obviously support it
- A lot of older Serial printer (like Metapace T-1) also support it

More specific information about tested printers can be found in the wiki: [Printer-Settings](https://sales-and-dungeons.app/docs/printer/models)

## How It Works

<img align="left" alt="Sales &amp; Dungeons" src="./data/work_graph.svg">

**Templates:** Templates are created in HTML (and CSS) in combination with the Nunjucks templating language. You can imagine
the templates as little websites. That makes it possible to use all the nice and convenient layout options that HTML and CSS
has to offer and even include any common framework you might need (e.g. Fontawesome for Icons).

**Rendered HTML:** After creating a template you can create entries with the data you want and print them.
Nunjucks will create the rendered HTML from the data you want to print.

**Rendered Image:** Then this HTML get's converted to a image. Currently this conversion is done by Chrome via the
Chrome Debug Protocol. Although Chrome seems like a huge overkill for just HTML-To-Image conversion it's the standard solution at the
moment because it supports most of the modern HTML and CSS features.

**ESC / POS Commands:** The last step before our awesome template hits the Printer is the conversion from the rendered image
to the "draw image" command of the printer.

**Printer:** The generated command will then be sent to the printer and printed. Now your template is ready to be used!

:tada: :tada: :tada:

## Printers, Templating & Building

If you want to see what printers were already tested, which settings they need, how the templates work or how you can build Sales & Dungeons yourself please visit the [**wiki**](https://sales-and-dungeons.app/docs/intro).

## Thanks to all contributors ❤

<a href="https://github.com/BigJk/snd/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=BigJk/snd" />
</a>

## Thanks to JetBrains

This Project is supported with a JetBrains License through the [Open Source Support Program](https://www.jetbrains.com/community/opensource).

<img width="140" src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.png" alt="JetBrains Logo (Main) logo.">

## Credits

Icons used in the Sales & Dungeons Logo were made by [Smashicons](https://www.flaticon.com/authors/smashicons), [Good Ware](https://www.flaticon.com/authors/good-ware) from [www.flaticon.com](http://www.flaticon.com)
