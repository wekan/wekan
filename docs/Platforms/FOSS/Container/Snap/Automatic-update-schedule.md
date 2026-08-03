## a) Install all Snap updates automatically between 02:00AM and 04:00AM
```
snap set core refresh.schedule=02:00-04:00
```
## b) Update once a week at Sunday between 02:00AM and 04:00AM
```
snap set core refresh.schedule=sun,02:00-04:00
```
## c) Update last Sunday of the month between 02:00AM and 04:00AM
```
snap set core refresh.schedule=sun5,02:00-04:00
```
## [Update until specific day](https://snapcraft.io/docs/keeping-snaps-up-to-date#heading--refresh-hold) and other examples.

## If required, you can disable all Snap updates
at `/etc/hosts` by adding a line:
```
127.0.0.1 api.snapcraft.io
```
## No schedule set

Automatic upgrades happen sometime after Wekan is released, usually quite soon. 

## Manual update immediately

`sudo snap refresh`

