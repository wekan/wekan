Wekan works on x64. There is not yet version for [Raspberry Pi](https://github.com/wekan/wekan/issues/1053).

Wekan requires MongoDB 3.2.x . For other requirements and versions see [VirtualBox scripts](https://github.com/wekan/wekan-maintainer/tree/master/virtualbox) or [Dockerfile](https://github.com/wekan/wekan/blob/main/Dockerfile).

Known bugs with other versions:
- Node 6.x: 100% CPU usage.
- MongoDB 3.4.x: Wekan crashes when uploading attachment.
- [Hardened kernel prevents creating new Wekan boards at Sandstorm](https://github.com/wekan/wekan/issues/1398)
