# Description

When Wekan is loading big board, selected Wait Spinner animation is shown.

# Allowed Wait Spinners

[Source](https://github.com/wekan/wekan/blob/main/config/const.js#L52-L61)

Currently:
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

# Settings at Admin Panel

Admin Panel / Layout / Wait Spinner

# Source

```
export WAIT_SPINNER=Bounce
```

# Docker

```
- WAIT_SPINNER=Bounce
```

# Snap

```
sudo snap set wekan wait-spinner='Bounce'

sudo snap set wekan-gantt-gpl wait-spinner='Bounce'
```

# Non-English Translations, done at web only

https://app.transifex.com/wekan/

# Original English source

https://github.com/wekan/wekan/blob/main/i18n/en.i18n.json


