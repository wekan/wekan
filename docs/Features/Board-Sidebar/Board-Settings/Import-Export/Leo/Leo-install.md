# Installing Leo

## What it is

How to install [Leo](https://leo-editor.github.io/leo-editor/), the outlining
editor whose `.leo` files WeKan imports and exports, on Linux arm64. This is a
setup note for the [Leo format](Leo.md), not a WeKan feature of its own.

## Read more

- [Wikipedia: Leo (text editor)](https://en.wikipedia.org/wiki/Leo_(text_editor))
- [Leo](Leo.md): importing and exporting Leo outlines in WeKan

## How to use it

https://leo-editor.github.io/leo-editor/

Install at Linux arm64:
```
sudo apt -y install build-essential python3-dev python3-pip python3-pyqt5*

pip3 install pip --user --upgrade

pip3 install leo --user --upgrade

leo
```

## Commits

 - [Reorganize docs: platform pages under docs/Platforms, and update their links](https://github.com/wekan/wekan/commit/5b04b4b47c1b04e99b7b6172adf25dab89dddf6b)
 - [Add the docs from the wekan.wiki, the Leo install note among them](https://github.com/wekan/wekan/commit/73ae73d4c38640e9daedbe8ef9e5b25b877ee804)
