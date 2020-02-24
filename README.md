# Sales &amp; Dungeons

[![Discord](https://img.shields.io/discord/678654745803751579?label=discord)](https://discord.gg/5MUZEjc)

Thermal Printer as D&amp;D Utility.

**Warning:** This is still rough and early version. If you want to get this working the best way is to jump on the Discord and ask for help.

## Printers & Settings

If you want to see what printers were already tested and which settings they need please visit the wiki [**HERE**](https://github.com/BigJk/snd/wiki/Printer-Settings)

## Pre-Build Binaries

If you want to get started right away you can just download the pre-build binaries for your OS and get started right away!

### Windows

1. Download the latest Release [**HERE**](http://snd.ftp.sh:2015/windows-amd64/?sort=time&order=desc)
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

## Building Sales & Dungeons

### Linux
This project is written in `go`, so you will need `go` installed on your system to compile `snd`.

#### Installing golang
Go to [https://golang.org/doc/install](https://golang.org/doc/install) for complete instructions, but the following will probably work:

Download the Linux tarball
```
cd ~/Downloads
wget -c https://dl.google.com/go/go1.13.8.linux-amd64.tar.gz
```

Extract it into `/usr/local` (Note: this will put `go` files in `/usr/local/go/`, not `/usr/local/bin/go`. Apparently that is how `go` is expecting to be.)

```
sudo tar -C /usr/local -xvzf go1.13.8.linux-amd64.tar.gz
```

Now setup your Go workspace by creating a directory `~/go` which is the root of your workspace. The workspace is made of three directories namely:
- `bin` which will contain Go executable binaries.
- `src` which will store your source files and
- `pkg` which will store package objects.

```
mkdir -p ~/go/{bin,src,pkg}
```

Now we add `/usr/local/go/bin` to PATH (here we're doing a local user installation):
```
echo 'export  PATH=$PATH:/usr/local/go/bin' >> ~/.profile
```

(You might need to `source ~/.profile` if you're about to use `go` in the same terminal window you have running right now.)

##### Installing `snd`

Decide where you want your source files to be (I put mine in `~/src`) and `cd` there. Then
```
git clone https://github.com/BigJk/snd
```

Download all the dependencies for `snd`:
```
go mod tidy
go mod download
```

Download the frontend:

go to [http://snd.ftp.sh:2015/frontend-only](http://snd.ftp.sh:2015/frontend-only) and download the latest version.

Then `cd` to your `snd` folder, and do extract the file there.

Now to run the `snd` server, just do
```
cd ~/src/snd/
go run cmd/main.go
```

and the web interface is at [http://localhost:7123](http://localhost:7123).

### Windows
(Instructions will be added here soon)
### macOS
(Instructions will be added here soon)
