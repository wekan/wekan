[Original issue](https://github.com/wekan/wekan/issues/4512)

## Introduction

Previously WeKan used Stylus, that is similar to CSS. Stylus has some additional features.

Stylus code was located at `wekan/client/components/*/*.styl`, for example `wekan/client/components/boards/boardsList.styl`.

## Why

- `coagmano:stylus` is not maintained anymore
- When building meteor bundle, `coagmano:stylus` causes [errors like Warning: Accessing non-existent property 'lineno' of module exports inside circular dependency](https://github.com/Meteor-Community-Packages/meteor-stylus/issues/9) with newest Meteor 2.7.2
- Removing `coagmano:stylus` fixed [Mermaid Diagram error: Maximum call stack size exceeded](https://github.com/wekan/wekan/issues/4251) from browserside right click / Inspect / Console. After removing `coagmano:stylus`, that error was not there anymore.

## Converting Stylus to CSS

[Source](https://github.com/wekan/wekan/blob/main/releases/stylus-to-css.sh)

#### 1) Install Stylus
```
sudo npm -g install stylus
```
#### 2) Comment out `@import 'nib'` that is not supported syntax in newest plain Stylus, for all .styl files in directory
```
sed -i "s|@import 'nib'|//@import 'nib'|g" *.styl
```
That code `@import 'nib'` is using [CSS imports](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) that does [Eric Meyer's CSS reset of styles](https://github.com/stylus/nib/blob/master/lib/nib/reset.styl). xet7 [added that reset to separate CSS file](https://github.com/wekan/wekan/commit/985c2cdbfdb38eb43852f3aa257859bbd3f817b9). While in [original converting Stylus to CSS](https://github.com/wekan/wekan/commit/072778b9aaefd7fcaa7519b1ce1cafc1704d646d) that `@import 'nib'` was in many files, it seems it's enough to have it at [client/components/boards/boardsList.css](https://github.com/wekan/wekan/commit/985c2cdbfdb38eb43852f3aa257859bbd3f817b9#diff-c227ea7dd2df8f46604db81ce7c49902b7e8829266ab79bb1c80077b5ba2b5b0) that is used at all pages of WeKan.

Alternative to CSS imports would be to add that CSS code to beginning of that CSS file where it is needed.

Other CSS transpilers may use similar imports.

Not having all requires CSS can be seen like:
- [Some extra bullets](https://github.com/wekan/wekan/issues/4516)
- [Some wrong colors](https://github.com/wekan/wekan/issues/4519)

#### 3) For all files in directory, run command `stylus filename.styl`
```
ls *.styl | xargs stylus
```
#### 4) Remove `coagmano:stylus`
```
meteor remove coagmano:stylus
```
#### 5) Delete .styl files
```
cd wekan
rm client/components/*/*.styl
```

