## Built-in: WeKan cpu-exec does this automatically

Since WeKan 9.96, the manual wrapper below is built in: every Linux WeKan bundle/Snap/Docker
image ships a general `cpu-exec` helper (plus a same-arch `qemu-<arch>` static binary in the
bundles) that runs any binary through qemu-user automatically when the CPU lacks features the
binary needs — e.g. MongoDB 5+ on Raspberry Pi 4 and older (ARMv8.0, no ARMv8.2-A):

```
cpu-exec --features x86_64=avx,aarch64=atomics mongod --config /etc/mongod.conf
```

See [mongodb-avx-qemu.md](mongodb-avx-qemu.md) for details. The manual steps below still work
for a system-wide MongoDB outside WeKan.

## Meteor podcast about using MongoDB at unsupported CPUs 

- https://www.youtube.com/watch?v=bnU9bUVeN04
- Making MongoDB working with Qemu: https://github.com/wekan/wekan/issues/4321#issuecomment-3006557279

## Installing MongoDB 

MongoDB 8 arm64 works at M1 Air arm64 macOS and Linux.

But because MongoDB 8 core dumps at RasPi4, running it here with Qemu.

1. Install Ubuntu 24.04 arm64 for Raspberry Pi

2. Install MongoDB 8 repo for Ubuntu 24.04 arm64

3. Install deps:

```
sudo apt -y install qemu-user
```

4. Rename MongoDB to different filename:

```
sudo mv /usr/bin/mongod /usr/bin/mongodreal
```

5. Edit start scipt for Qemu MongoDB

```
sudo nano /usr/bin/mongod
```

6. Copy paste start script for Qemu MongoDB

It uses qemu-user to run MongoDB,
and passes all command line arguments to MongoDB.

```
#!/bin/bash
/usr/bin/qemu-arm64 /usr/bin/mongodreal --config /etc/mongod.conf
```

7. Save and exit nano: Ctrl-o Enter Ctrl-x Enter

8. Make script executeable

```
sudo chmod a+x /usr/bin/mongod
```

9. Start and run MongoDB

```
sudo systemctl enable mongod

sudo systemctl start mongod
```

