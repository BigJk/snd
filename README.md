<img align="right" width="120px" alt="Sales &amp; Dungeons" src="./data/preview.png">
<img width="100" alt="Sales &amp; Dungeons" src="./data/round_icon.png">

[![Discord](https://img.shields.io/discord/678654745803751579?label=discord)](https://discord.gg/5MUZEjc)

**Sales & Dungeons** — Thermal Printer as D&amp;D Utility.

With Sales & Dungeons you can create highly customizable handouts, quick reference and much more for your Dungeons and Dragons (or other PnP) Sessions.
Most Thermal Printer are small in size and can be taken with you and kept right at the gaming table. Use-cases range from printing out magic items, spells
or a letter that the group found to little character sheets of your players to use as DM note. The possibilities are nearly endless!

**Warning:** This is still rough and early version. If you want to get this working the best way is to jump on the Discord and ask for help.

## Features

- Works on Windows, Mac and Linux
- Extensive Templating system through [Nunjucks](https://mozilla.github.io/nunjucks/)
- Extendable through Scripts
  - Import hundreds of Monsters, Magic Items, Spells and more from API's like Open5e
- Various connection methods
  - Windows Direct Printing
  - Raw USB Printing
  - CUPS
  - Serial (coming in the future)

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

## Pre-Build Binaries

If you don't want to mess with compiling the code yourself you can just download the pre-build binaries for your OS and get started right away!

### Windows

1. Download the latest Release for [**Windows (amd64)**](http://snd.ftp.sh:2015/windows-amd64/?sort=time&order=desc)
2. Unpack
3. Start the `Sales & Dungeons.exe`
4. Wait for the GUI to show up

### Linux & Mac

1. Download the latest Release for [**Linux (amd64)**](http://snd.ftp.sh:2015/linux-amd64/?sort=time&order=desc), [**MacOS (i386)**](http://snd.ftp.sh:2015/darwin-386/?sort=time&order=desc) or [**MacOS (amd64)**](http://snd.ftp.sh:2015/darwin-amd64/?sort=time&order=desc)
2. Unpack
3. ``cd`` into the folder in your terminal
4. make it exectuable ``chmod +x ./Sales\ \&\ Dungeons``
5. run it ``./Sales\ \&\ Dungeons``
6. Open the web interface in your browser under [http://localhost:7123](http://localhost:7123)


## Printers, Templating & Building

If you want to see what printers were already tested, which settings they need, how the templates work or how you can build Sales & Dungeons yourself please visit the [**wiki**](https://github.com/BigJk/snd/wiki).
