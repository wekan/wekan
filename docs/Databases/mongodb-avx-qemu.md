## Meteor podcast about using MongoDB at unsupported CPUs

- https://www.youtube.com/watch?v=bnU9bUVeN04
- Making MongoDB working with Qemu: https://github.com/wekan/wekan/issues/4321#issuecomment-3006557279

## MongoDB Operating System Support precompiled binaries

- arm64: Only Ubuntu. No Raspberry Pi OS, Alpine Linux.
  - But installing .deb packages to Raspberry Pi 5 running Raspberry OS 64bit can have hardware running cooler, than on Ubuntu.
- For anything else, see MongoDB download page.

## MongoDB CPU support

New MongoDB supports newer CPUs only, like:
- x86_64 that have AVX instructions, from MongoDB 5 and later
- ARMv8.2-A microarchitecture, from MongoDB 4.4.19, 5.0, 6.0 and later, like:
  - Raspberry Pi 5
  - OrangePi 5
  - Apple Silicon arm64

Old MongoDB 4.4.18 supports old CPUs, like:
-  Intel Core 2 Duo, CPU does not support AVX instructions
-  ARMv8.0 microarchitecture, like Cortex A53/A55/A72:
  - Raspberry Pi 3, Cortex-A53, https://en.wikipedia.org/wiki/Raspberry_Pi
  - Raspberry Pi 4, Cortex-A72
  - Orange Pi 3, https://en.wikipedia.org/wiki/Orange_Pi

Info about requiring newer arm64:
- https://www.mongodb.com/community/forums/t/mongodb-community-6-0-5-illegal-instruction-core-dumped-ubuntu-18-04-on-cortex-a72-aarch64/223970/3

Detecting does x86_64 CPU support AVX:
- https://github.com/wekan/wekan/issues/4321#issuecomment-2469332492

Error running MongoDB 8 at RasPi4, when not using Qemu:

```
December 06 11:48:49 rpi4b systemd[1]: Started mongod.service - MongoDB Database Server.
December 06 11:48:53 rpi4b mongod[3749]: /usr/bin/mongod: line 4:  3750 Illegal instruction     (core dumped) /usr/bin/mongodreal --co>
December 06 11:48:53 rpi4b systemd[1]: mongod.service: Main process exited, code=exited, status=132/n/a
December 06 11:48:53 rpi4b systemd[1]: mongod.service: Failed with result 'exit-code'.
```
## a) Prebuilt binary

MongoDB 7.3.4 for RasPi4 and older:
- https://github.com/123swk123/mongodb-armv8-a/releases/tag/v7.3.4-alpha

## b) Compile MongoDB, takes a lot of time

CrossCompiling MongoDB from x86_64 to ARMv8.0 Cortex A53/A55/A72 like RasPi4 and older:
- https://github.com/123swk123/mongodb-armv8-a

Compiling MongoDB from x86_64 to x86_64 CPUs that does not have AVX instructions:
- https://github.com/GermanAizek/mongodb-without-avx/blob/main/Dockerfile

## c) Run MongoDB with Qemu, that supports newest CPU features

qemu-user can run single Linux executeable for many architectures. It does not emulate full OS like qemu-system.

Running MongoDB with Qemu on x86_64 CPU that does not support AVX, like Intel Core 2 Duo:
- https://github.com/stevekerrison/mongo-qemu-avx

Running MongoDB with Qemu on older arm64, like RasPi4 and older RasPi:
- https://github.com/xet7/simpletasks/blob/main/install-mongodb.md
