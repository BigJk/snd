#!/bin/bash

echo "Sales & Dungeons Downloader"

# Base folder
dest=~/snd
zip=$dest/release.zip
type=${SND_TYPE:-"gui"}
arch=${SND_ARCH:-$(arch)}

# Get the system name
sysname=$(uname -s)

# Set the variable based on the system name
if [ "$sysname" == "Darwin" ]; then
    os="macos"
elif [ "$sysname" == "Linux" ]; then
    os="linux"
else
    echo "Unknown system: $sysname"
    exit 1
fi

echo "Dest : $dest"
echo "Zip  : $zip"
echo "OS   : $os"
echo "Arch : $arch"
echo "Type : $type"

# Fetch latest zip url
url=$(curl https://api.github.com/repos/BigJk/snd/releases | grep /snd-$os-$arch-$type- | grep -o 'https://.*\.zip' | head -n 1)

echo "========================================================"
echo "Downloading: ${url}"

# Setup folders
mkdir $dest
rm $zip

curl "$url" -J -L -o $zip || { echo 'Failed!' ; exit 1; }

# Delete old data
rm "$dest/Sales\ \&\ Dungeons" 
rm "$dest/version.txt"
rm -r "$dest/frontend"
rm -r "$dest/data"

echo "========================================================"
echo "Unzipping..."

unzip -o -d "$dest" "$zip" || { echo 'Failed!' ; exit 1; }
folder=$(ls $dest | grep snd-$os-$arch-$type-)
cp -r $dest/$folder/* $dest/
rm -r $dest/$folder

chmod +x "$dest/Sales & Dungeons" || { echo 'Failed!' ; exit 1; }

echo "========================================================"
echo "Finished"
echo ""
echo "Start S&D from terminal with:"
echo "~/snd/Sales\ \&\ Dungeons"
echo "or double click 'Sales & Dungeons' in the ~/snd/ folder"

# Open folder in system file viewer
if [[ "$OSTYPE" == "darwin"* ]]; then
    open $dest
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open $dest
fi
