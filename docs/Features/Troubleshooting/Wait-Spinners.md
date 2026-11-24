# Wait Spinners

## What it is

When WeKan is loading a big board, the selected Wait Spinner animation is shown,
so you can see that WeKan is still working and has not stopped. The admin can
choose which animation it is, for the whole instance.

## Read more

- [Throbber](https://en.wikipedia.org/wiki/Throbber) on Wikipedia - the general
  name of such a "busy" animation.
- [SpinKit](https://tobiasahlin.com/spinkit/), the CSS spinner set the `sk-spinner`
  animations come from.
- Related WeKan page:
  [Admin Panel / Settings / Appearance](../Admin-Panel/Settings/Appearance.md).

## How to use it

**Choose the spinner at Admin Panel.**

1. Open Admin Panel / Settings /
   [Appearance](../Admin-Panel/Settings/Appearance.md).
2. In the **All Boards: Hide** group, find **Wait Spinner** and pick one of
   the names below; the animation beside it previews your pick.
3. Click **Save** at the end of the group. The choice is stored in the settings
   document and is used from then on.

The Layout pane it used to be in is [PWA](../Admin-Panel/Settings/PWA.md)
now, and holds only the PWA settings.

**Or set the default with an environment variable.** Allowed Wait Spinners
([source](../../../config/const.js)), currently:

```
  'Bounce',
  'Cube',
  'Cube-Grid',
  'Dot',
  'Double-Bounce',
  'Rotateplane',
  'Scaleout',
  'Wave'
```

Source:

```
export WAIT_SPINNER=Bounce
```

Docker:

```
- WAIT_SPINNER=Bounce
```

Snap:

```
sudo snap set wekan wait-spinner='Bounce'

sudo snap set wekan-gantt-gpl wait-spinner='Bounce'
```

## How the numbers are calculated

There are no numbers. The default is `Bounce`: `getSpinnerName()` in
[client/lib/spinner.js](../../../client/lib/spinner.js) starts from `Bounce`,
uses `WAIT_SPINNER` when it is one of the allowed names, and then the Admin
Panel choice (`spinnerName`) when one is saved, so the Admin Panel wins.

## How it works in WeKan

- [server/spinner.js](../../../server/spinner.js) copies `WAIT_SPINNER` into
  `Meteor.settings.public.WAIT_SPINNER` for the client.
- `ALLOWED_WAIT_SPINNERS` in [config/const.js](../../../config/const.js) is the
  list the Admin Panel select (`selectSpinnerName` in
  [client/components/settings/settingBody.js](../../../client/components/settings/settingBody.js))
  offers; the choice is saved as `spinnerName` in the `settings` collection
  ([models/settings.js](../../../models/settings.js)) and published by
  [server/publications/settings.js](../../../server/publications/settings.js).
- `getSpinnerTemplate()` turns the name into a template name, `spinner` plus the
  name without its first `-` (for example `spinnerCubeGrid`), rendered by
  [client/components/main/spinner.js](../../../client/components/main/spinner.js);
  each animation is its own `spinner_*.jade` and `spinner_*.css` in
  `client/components/main/`. Lists use the same name for the CSS class
  `sk-spinner-<name>` ([client/components/lists/listBody.js](../../../client/components/lists/listBody.js)).

## Translations

Non-English translations are done at the web only, at
[Transifex](https://app.transifex.com/wekan/). The original English source is
[imports/i18n/data/en.i18n.json](../../../imports/i18n/data/en.i18n.json)
(key `wait-spinner`).

## Commits

 - [Remaining WAIT_SPINNER settings for Docker, Snap and source](https://github.com/wekan/wekan/commit/488b765f95ad67b19630cd125543836c04eaa24f)
 - [Cube-Grid spinner](https://github.com/wekan/wekan/commit/0caff7d5d5763c3a7012d2dbf521b0dee6c22a73)
 - [Default spinner from an environment variable](https://github.com/wekan/wekan/commit/ba4153312852db4e91d586fe28c0e5012e9a3f55)
 - [Spinner code in its own library file](https://github.com/wekan/wekan/commit/1d66058240167e443d1b19d48b4a867b4efc7ca6)
 - [Spinner choice is reactive](https://github.com/wekan/wekan/commit/43ac328e8ada567bd0ea0b930065b62e7d6a66d2)
 - [Spinner chosen in the Admin Panel settings](https://github.com/wekan/wekan/commit/7519abf3fe8735691d44e199301368c4d085c7ae)
 - [Spinner configurable in the source code](https://github.com/wekan/wekan/commit/06a2b087807a49b775c6bd7bd81b251bd3d50b89)
