# ChangeLog

This package is capnp-es 0.0.16 with complete Cap'n Proto RPC Resolve and
Release handling, used at Meteor 3 WeKan on Sandstorm with Node.js 26.x.

## Upcoming capnp-es release

- Forked from npm `capnp-es@0.0.16` (upstream commit `439f564`). The RPC `Conn`
  handles Resolve (with Disembargo), Release, tail calls
  (`sendResultsTo.yourself` / `takeFromOtherQuestion`), `noFinishNeeded` and
  Unimplemented; `DeferredTransport` queues messages; the compiler no longer
  regenerates structs declared in another file; `capnp/stream` is shipped. See
  [README.md](README.md) and [patches/wekan.patch](patches/wekan.patch).
  Thanks to xet7.
