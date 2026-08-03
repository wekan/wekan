This is totally oversimplified TLDR comparison that leaves out a lot of details.

## Both Wekan and Sandstorm

* Authentication
* Admin Panel
* Wekan kanban board
* Can be installed to Ubuntu 16.04 64bit without Docker
* Can run inside Docker, see [Sandstorm within Docker](https://docs.sandstorm.io/en/latest/install/#option-6-using-sandstorm-within-docker)

## Difference: User interface

### Wekan

[Themes feature](https://github.com/wekan/wekan/issues/781), pull requests welcome.

### Sandstorm

[Themes feature](https://github.com/sandstorm-io/sandstorm/issues/1713#issuecomment-301274498), pull requests welcome.

[Current Admin Panel / Authentication screenshots](https://discourse.wekan.io/t/sso-passing-variables-through-url/493/8).

The user interface in Sandstorm is one of Sandstorm's [long list of high-end security features](https://docs.sandstorm.io/en/latest/using/security-practices/) protecting potentially malicious applications running on Sandstorm sandboxes/grains to hijack whole full screen interface and do phishing of information, stealing admin credentials when replacing admin menus, etc. It's black to be totally recognizable and different from other applications. Having it hidden or on not so dark would make new users to not find it. There has been usability testing of Sandstorm's user interface. Sandstorm has been fully security audited and found problems fixed already.

## Difference: Hardware requirements

### Wekan

* Can run on less powerful hardware than Sandstorm
* Could potentially run on ARM, if there is Meteor.js port for ARM. Some platform running on Raspberry Pi could already have Wekan, someone needs to do more research about it.

### Sandstorm

* Works only on x64 platform
* Requires at least 1GB RAM
* Is very efficient in handling RAM, shutting down sandboxes/grains when they are not in use.
