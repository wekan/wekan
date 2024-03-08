## Downloads

Downloading and installing Wekan on various platforms.

Only newest Wekan is supported. Please check you are running newest Wekan, because old versions of Wekan have old Node.js and other vulnerabilities.

## Related 

* [Wekan new release ChangeLog](https://github.com/wekan/wekan/blob/main/CHANGELOG.md)
* [Adding Users](Adding-users)
* [Forgot Password](Forgot-Password)
* [Settings](Settings)
* [Email](Troubleshooting-Mail)
* **[Backup and Restore](Backup) <=== VERY CRITICAL. DO AUTOMATICALLY OFTEN !!**
* [Logs and Stats](Logs)
* [Wekan bug reports and feature requests](https://github.com/wekan/wekan/issues)
* [Proxy](https://github.com/wekan/wekan/issues/1480)

***

## <a name="ProductionUnivention"></a>Production: [Univention](https://www.univention.com/products/univention-app-center/app-catalog/wekan/) platform, many apps and Wekan.

- Virtual Appliances Download: [VirtualBox, KVM, VMware, VMware ESX](https://www.univention.com/products/univention-app-center/app-catalog/wekan/)
- [Video of installing Univention Wekan Appliance](https://wekan.github.io/UCS-4.4-with-wekan-10.200.2.25.webm)
- After installing, you get license key file in email. Go with webbrowser to VM ip address like http://192.x.x.x and upload license. After that also on VM screen console login as root is possible. If you install KDE app from App Center with webbrowser, you get KDE on VM screen.
- [Wekan for Univention Feature Requests and Bug Reports](https://github.com/wekan/univention)
- [Univention Open Source repos](https://github.com/Univention)
- [Univention interview at FLOSS Weekly 480](https://twit.tv/shows/floss-weekly/episodes/480) 
- VM based on Debian. Free and Enterprise versions of Univention are same, only difference is paid support.
- Univention VM can be standalone, or replace Windows Server Active Directory, or join to existing Active Directory. Has web UI, LDAP server, Users/Groups management, adding user to app.
- Wekan LDAP login is integrated to Univention LDAP. Create at Univention web UI at Users management LDAP Domain Admin user, and add Wekan app for that user, to get Wekan Admin Panel. Normal users don't have Admin Panel.
- Has Wekan. From App Center you can install RocketChat, WordPress, OnlyOffice, NextCloud, OpenXChange, etc. Some apps are full free versions, some other apps require payment for more features. Wekan is full free version.
- Wekan on Univention is based Wekan Docker version. Upgrading all apps on Univention upgrades also Wekan to newest available Wekan version.
- Newer version of Wekan will be released when building and testing is done.

***
* Cloud: Some additional info
  * [AWS](AWS)
  * [Azure](Azure)
  * [OpenShift](OpenShift)

***

## Production: SaaS, Wekan ready paid services, just start using.

* [Wekan Team](https://wekan.team/commercial-support/) - Snap Gantt Gpl Automatic Updates. Supports Wekan maintenance and development.
* [Cloudron](Cloudron) - Standalone Wekan
* [PikaPods](PikaPods) - Standalone Wekan with managed updates and backups.
* [Scalingo](Scalingo) - Standalone Wekan

## <a name="ProductionDocker"></a>Not exposed to Internet: Docker. No automatic upgrades.

Keep backups, Docker is more complex than others above. Use only if you have time to test new release first, and it's critical nothing gets broken. Because Docker does not have automatic updates, please keep behind firewall, without any ports open to Internet, because Wekan gets new security etc updates to Node.js and other dependencies often.

* [Docker](Docker)
  * [Windows](Windows) + build from source
  * [Mac](Mac)
  * [SLES 64bit](Install-Wekan-Docker-on-SUSE-Linux-Enterprise-Server-12-SP1)
* [Proxy](https://github.com/wekan/wekan/issues/1480)

*** 
## Not exposed to Internet: Bundle for [RasPi 3, arm64, Windows and any Node+Mongo CPU architectures](Raspberry-Pi). No automatic updates, no sandboxing.

New at 2019-06-30. If CPU architecture has enough RAM and fast harddisk, it can be used, but there
is no automatic updates and no sandboxing.

New at 2019-09-08. You can also try [bash install script and automatic
upgrade script](https://github.com/wekan/wekan-bash-install-autoupgrade).

Stop Wekan. Download newest bundle version at https://releases.wekan.team .

Install Node 8.16.2 and some MongoDB like 3.2.x - 4.x. Preferred 4.x if available.
Bundle works for Windows native Node.js and MongoDB, arm64 server, etc any CPU node+mongodb.
Building from source does not seem to work on Windows.

Extra steps only for CentOS 6:
- Install gcc-4.9.3 and boost
- Add gcc to path, for example: `export LD_LIBRARY_PATH=/root/gcc-4.9.3/lib/gcc/x86_64-unknown-linux-gnu/4.9.3/:$LD_LIBRARY_PATH`
- At below fibers step, do instead `npm install fibers@2.0.1`

Then, for example:
```
mkdir repos
cd ~/repos
rm -rf bundle
wget https://releases.wekan.team/wekan-3.52.zip
unzip wekan-3.01.zip
cd bundle/programs/server
npm install
npm install node-gyp node-pre-gyp fibers
cd ../../..
```
Then modify `start-wekan.sh` or `start-wekan.bat` for Node and MongoDB paths.
See [Raspberry Pi page](Raspberry-Pi) for info about systemd etc.

***

## <a name="Development"></a>Development: Not updated automatically.
* [Virtual appliance](virtual-appliance) - old
* [Source](Source) for development usage only. Source, Snap, Docker, Sandstorm, Meteor bundle and Windows build instructions.
* [Vagrant](Vagrant)
* Upcoming:
  * [Friend](Friend) - Snap Standalone Wekan

## Operating Systems

* [Debian 64bit](Debian)
* [SmartOS](SmartOS)
* [FreeBSD](FreeBSD)

## NAS

* [Qnap TS-469L](https://github.com/wekan/wekan/issues/1180)

## Other Clouds. Can have some restrictions, like: Requires from source install, has restricted 2.x kernel, does not support websockets, or not tested yet.

* [Uberspace](Install-latest-Wekan-release-on-Uberspace)
* [OVH and Kimsufi](OVH)
* [OpenVZ](OpenVZ)
* [Heroku](Heroku) ?
* [Google Cloud](Google-Cloud) ?
* [Cloud Foundry](Cloud-Foundry) ?

## Does not work yet: [DEB/RPM packages at Packager.io](https://packager.io/gh/wekan/wekan)

New at 2019-08-04. For Ubuntu, Debian, CentOS and SLES.
[Testing how to get it working in progress here](https://github.com/wekan/wekan/issues/2582).

# More

[Features](Features)

[Integrations](Integrations)

[install_source]: https://github.com/wekan/wekan/wiki/Install-and-Update#install-manually-from-source
[installsource_windows]: https://github.com/wekan/wekan/wiki/Install-Wekan-from-source-on-Windows
[cloudron_button]: https://cloudron.io/img/button.svg
[cloudron_install]: https://cloudron.io/button.html?app=io.wekan.cloudronapp
[docker_image]: https://hub.docker.com/r/wekanteam/wekan/
[heroku_button]: https://www.herokucdn.com/deploy/button.png
[heroku_deploy]: https://heroku.com/deploy?template=https://github.com/wekan/wekan/tree/main
[indiehosters_button]: https://indie.host/signup.png
[indiehosters_saas]: https://indiehosters.net/shop/product/wekan-20
[sandstorm_button]: https://img.shields.io/badge/try-Wekan%20on%20Sandstorm-783189.svg
[sandstorm_appdemo]: https://demo.sandstorm.io/appdemo/m86q05rdvj14yvn78ghaxynqz7u2svw6rnttptxx49g1785cdv1h
[scalingo_button]: https://cdn.scalingo.com/deploy/button.svg
[scalingo_deploy]: https://my.scalingo.com/deploy?source=https://github.com/wekan/wekan#master
[wekan_mongodb]: https://github.com/wekan/wekan-mongodb
[wekan_postgresql]: https://github.com/wekan/wekan-postgresql
[wekan_cleanup]: https://github.com/wekan/wekan-cleanup
[wekan_logstash]: https://github.com/wekan/wekan-logstash
[autoinstall]: https://github.com/wekan/wekan-autoinstall
[autoinstall_issue]: https://github.com/anselal/wekan/issues/18
[debian_wheezy_devuan_jessie]: https://github.com/wekan/sps
