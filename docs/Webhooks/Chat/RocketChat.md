Info for Self-Hosted RocketChat Community Server, using RocketChat server Snap from https://snapcraft.io/rocketchat-server

## Install snapd

Linux:

https://snapcraft.io/docs/installing-snapd

Windows:

https://github.com/wekan/hx/tree/main/prototypes/ui/gambas#install-on-windows

## Install RocketChat Snap

```
sudo snap install rocketchat-server
```

## Setup siteurl

List current Snap settings:
```
sudo snap get rocketchat-server
```
Then set your siteurl of your RocketChat server:
```
sudo snap set rocketchat-server siteurl='https://chat.yourcompany.com'
```

## RocketChat Skip Install Registration Wizard Fix

Q:

- [RocketChat Skip Install Registration Wizard Fix](https://github.com/RocketChat/Rocket.Chat/issues/31163#issuecomment-1848364117)


A:

For someone using snap, it means creating a file `/var/snap/rocketchat-server/common/override-setup-wizard.env ` (the name of the file itself could be anything as long as it has an .env extension) and setting its content to `OVERWRITE_SETTING_Show_Setup_Wizard=completed`
 
Then, restarting the server by `systemctl restart snap.rocketchat-server.rocketchat-server.service`

If it does not work yet, then reboot.

## Workspace version unsupported

Q:

- [Workspace version unsupported, Self-Host Community Server](https://forums.rocket.chat/t/workspace-version-unsupported-self-host-community-server/19698)

A:

1) Change to newest Snap Stable channel, list at https://snapcraft.io/rocketchat-server dropdown menu

```
sudo snap refresh rocketchat-server --channel=6.x/stable --amend
```

2) Register your Self-Managed instance here, so login and mobile app start to work after that:

- https://cloud.rocket.chat/home
- https://chat.yourcompany.com/admin/subscription

## More RocketChat Snap related info

https://github.com/wekan/wekan/wiki/OAuth2

https://docs.rocket.chat/deploy/deploy-rocket.chat/deploy-with-snaps