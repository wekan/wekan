# Secure Sandbox: VSCode at Debian 13 amd64

Related files at this repo `.vscode` at [this commit](https://github.com/wekan/wekan/commit/639ac9549f88069d8569de777c533ab4c9438088).

## 1) Install Debian

Install Debian with username `wekan`, so that WeKan repo here, only directory where VSCode will have access:
```
/home/wekan/repos/wekan
```

## 2) Install Flatpak and VSCode

```
sudo apt install flatpak

sudo apt install gnome-software-plugin-flatpak

flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

sudo reboot

flatpak install flathub com.visualstudio.code
```

## 3) Edit VSCode desktop icon

```
nano ~/.local/share/applications/wekan-vscode.desktop
```
Content:
```
[Desktop Entry]
Name=VS Code - WeKan
Comment=Open the WeKan project with Flatpak
Exec=flatpak run com.visualstudio.code /home/wekan/repos/wekan
Icon=com.visualstudio.code
Terminal=false
Type=Application
Categories=Development;IDE;
StartupWMClass=code
```

## 4) Force VS Code to use the internal (isolated) browser

This setting is also added as git commit to VSCode settings.

This is the most important step. If this is "native", it will use the operating system window that sees everything.

1. Open VS Code.
2. Press `Ctrl + ,` (options).
3. Type in search: **Dialogs: Custom**
4. Change the `Files: Simple Dialog` setting to **on** (check the box).
5. Restart VS Code.

## 5) Set the strictest sandbox possible (in Terminal)

Run these two commands (the first clears everything, the second sets limits):

```bash
# Reset previous attempts
sudo flatpak override --reset com.visualstudio.code

# Block EVERYTHING except the display and the wekan folder
sudo flatpak override com.visualstudio.code \
--nofilesystem=home \
--nofilesystem=host \
--nofilesystem=xdg-run/gvfs \
--nofilesystem=xdg-run/gvfsd \
--filesystem=~/repos/wekan:rw \
--device=all \
--socket=wayland \
--socket=x11

```

## 6) Test "File -> Open Folder"

Now when you go to **File -> Open Folder**:

1. You will no longer see the fancy system file window, but VS Code's own, simple list.
2. If you try to go to the parent folder or somewhere else, **the list is empty** or it only shows `~/repos/wekan`.
