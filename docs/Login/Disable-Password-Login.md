## Description

At login screen, do not show password login. Only show login button (OAuth2, LDAP, etc).

## Snap

```
sudo snap set wekan password-login-enabled='false'
```
[wekan-help](../../snap-src/bin/wekan-help#L614)

## Docker
```
- PASSWORD_LOGIN_ENABLED=false
```
[docker-compose.yml](../../docker-compose.yml#L693)

## Windows On-Premise

[Offline](../Platforms/Propietary/Windows/Offline.md)
```
SET PASSWORD_LOGIN_ENABLED=false
```
[start-wekan.bat](../../start-wekan.bat#L467)

## Linux On-Premise

[Raspberry Pi](../Platforms/FOSS/RaspberryPi/Raspberry-Pi.md)
```
export PASSWORD_LOGIN_ENABLED=false
```
[start-wekan.sh](../../start-wekan.sh#L529)
