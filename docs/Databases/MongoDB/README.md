# MongoDB

WeKan's classic database. WeKan runs on MongoDB 3.0 … 8.0, and picks the Node
driver for the server it finds; [docker-compose-mongodb-v7.yml](https://github.com/wekan/wekan/blob/main/docker-compose-mongodb-v7.yml)
is the compose file for it. The default database of WeKan is
[FerretDB v1](../FerretDB/1) instead, which needs no database server.

| File | What it answers |
| --- | --- |
| [Driver-System.md](Driver-System.md) | Which Node driver is used for which server version, and how that is decided |
| [Version-Management.md](Version-Management.md) | Detecting the server version and switching to the matching binary + driver |
| [Compatibility-Guide.md](Compatibility-Guide.md) | What breaks between MongoDB 3.0 and 8.0 with Meteor, and the fixes |
| [Oplog-Configuration.md](Oplog-Configuration.md) | Why the OpLog matters for pub/sub, and how to turn it on |
| [OpLog-Enablement.md](OpLog-Enablement.md) | Whether it IS on, per deployment platform |
| [avx-qemu.md](avx-qemu.md) | Running MongoDB 5+ on a CPU with no AVX, through qemu-user |
| [raspi4-qemu.md](raspi4-qemu.md) | The same on a Raspberry Pi 4 and older (ARMv8.0, no ARMv8.2-A) |

Both qemu pages describe what WeKan's `cpu-exec` helper now does by itself: it
runs a binary under qemu-user when the CPU lacks the features that binary needs.

## See also

- [../FerretDB/1](../FerretDB/1) — the default database, and the four SQL backends behind it
- [../Migrations](../Migrations) — WeKan's own schema migrations
