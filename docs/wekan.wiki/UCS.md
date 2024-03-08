<img src="https://wekan.github.io/hosting/univention.svg" width="30%" alt="Univention logo" />

## <a name="ProductionUnivention"></a>Production: [Univention](https://www.univention.com/products/univention-app-center/app-catalog/wekan/) platform, many apps and WeKan ®

- Virtual Appliances Download: [VirtualBox, KVM, VMware, VMware ESX](https://www.univention.com/products/univention-app-center/app-catalog/wekan/)
- [Video of installing Univention WeKan ® Appliance](https://wekan.github.io/UCS-4.4-with-wekan-10.200.2.25.webm)
- After installing, you get license key file in email. Go with webbrowser to VM ip address like http://192.x.x.x and upload license. After that also on VM screen console login as root is possible. If you install KDE app from App Center with webbrowser, you get KDE on VM screen.
- [WeKan ® for Univention Feature Requests and Bug Reports](https://github.com/wekan/univention/issues)
- [Univention Open Source repos](https://github.com/Univention)
- [Univention interview at FLOSS Weekly 480](https://twit.tv/shows/floss-weekly/episodes/480) 
- VM based on Debian. Free and Enterprise versions of Univention are same, only difference is paid support.
- Univention VM can be standalone, or replace Windows Server Active Directory, or join to existing Active Directory. Has web UI, LDAP server, Users/Groups management, adding user to app.
- WeKan ® LDAP login is integrated to Univention LDAP. Create at Univention web UI at Users management LDAP Domain Admin user, and add WeKan ® app for that user, to get WeKan ® Admin Panel. Normal users don't have Admin Panel.
- Has WeKan ® . From App Center you can install RocketChat, WordPress, OnlyOffice, NextCloud, OpenXChange, etc. Some apps are full free versions, some other apps require payment for more features. WeKan ® is full free version.
- WeKan ® on Univention is based WeKan ® Docker version. Upgrading all apps on Univention upgrades also WeKan ® to newest available WeKan ® version.
- Newer version of WeKan ® will be released when building and testing is done.
- [RocketChat Webhook workaround](https://github.com/wekan/univention/issues/15)

## Feature Requests and Bugs

[WeKan ® for Univention Feature Requests and Bugs](https://github.com/wekan/univention/issues)

## Gantt

[How to use Gantt](Gantt)

UCS WeKan v5.71 and newer is using WeKan Gantt GPL version. [Source](https://github.com/wekan/wekan/issues/2870#issuecomment-954598565).

## Email on Univention

[Source](https://github.com/wekan/univention/issues/6#issuecomment-607986717)

### 1) WeKan ® product page, scroll down

![ucs-mail-1](https://user-images.githubusercontent.com/15545/78279227-e682f700-751f-11ea-83fc-d22bc71b77fb.png)

### 2) Click APP SETTINGS

![ucs-mail-2](https://user-images.githubusercontent.com/15545/78279301-fdc1e480-751f-11ea-9d7b-1632c71cd79a.png)

### 3) Mail Settings

https://github.com/wekan/wekan/wiki/Troubleshooting-Mail

![ucs-mail-3](https://user-images.githubusercontent.com/15545/78279359-129e7800-7520-11ea-9e22-a911826285ba.png)

# Repairing MongoDB

https://github.com/wekan/wekan/wiki/Repair-MongoDB