## Description

At login screen, do not show password login. Only show login button (OAuth2, LDAP, etc).

## Snap

```
sudo snap set wekan password-login-enabled='false'
```
https://github.com/wekan/wekan/blob/main/snap-src/bin/wekan-help#L614

## Docker
```
- PASSWORD_LOGIN_ENABLED=false
```
https://github.com/wekan/wekan/blob/main/docker-compose.yml#L693

## Windows On-Premise

https://github.com/wekan/wekan/wiki/Offline
```
SET PASSWORD_LOGIN_ENABLED=false
```
https://github.com/wekan/wekan/blob/main/start-wekan.bat#L467

## Linux On-Premise

https://github.com/wekan/wekan/wiki/Raspberry-Pi
```
export PASSWORD_LOGIN_ENABLED=false
```
https://github.com/wekan/wekan/blob/main/start-wekan.sh#L529
