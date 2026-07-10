# Alternative Architectures, JavaScript Engines and Rewrite Options

This page documents which CPU architectures WeKan can run on, **why** some
architectures are not supported, and what the realistic options are for
supporting more of them — alternative JavaScript engines and full server
rewrites (Go, Tcl/Tk, QuickJS, …).

It exists because the question keeps coming up: *"WeKan won't run on my 32-bit
ARM board / old x86 / ReactOS — can we fix that?"* The short answer is that the
limit is **Node.js**, not the database, and getting past it means either
compiling Node from source (where still possible) or rewriting the server in a
portable language.

## TL;DR

- WeKan's **server** is Meteor 3, which runs **only on Node.js 24**. The browser
  client is architecture-independent. So the supported-architecture list is
  exactly *"where is there a Node.js 24 build?"*.
- The **database is not the bottleneck**: [FerretDB v1](https://github.com/wekan/FerretDB)
  (pure Go, SQLite backend, MongoDB wire protocol) cross-compiles to far more
  architectures than Node does.
- **Node.js 24 dropped 32-bit**: no `armv7l`/`armhf` binaries (downgraded to
  *Experimental*, source-build only), no 32-bit x86 Linux (`i386`) at all.
- **Other JS runtimes do not help**: Deno and Bun cover *fewer* architectures
  than Node (x64/arm64 only). Portable engines (QuickJS, JavaScriptCore,
  SpiderMonkey, JVM-based Rhino/GraalJS) *do* run on 32-bit, but **none of them
  run Meteor/WeKan** — Meteor is locked to Node.
- If universal architecture coverage is the goal, a **Go server** (matching
  FerretDB) is the best target; **Tcl/Tk and QuickJS are worse fits** for a web
  app. All of these are large rewrites, not drop-in swaps.

## The two layers

Keep these separate — they have very different portability:

| Layer | Technology | Portability |
| --- | --- | --- |
| Client | HTML/CSS/JS in the browser | Architecture-independent (runs wherever a browser runs) |
| **Server** | **Meteor 3 → Node.js 24** | **Only where a Node.js 24 build exists** |
| Database | MongoDB *or* FerretDB v1 (Go) | MongoDB: amd64/arm64 only. FerretDB: almost everything |

Only the **server binary** (the Node.js runtime) constrains the architecture.

## Architecture support matrix

"Node 24" is what limits WeKan; "FerretDB v1" shows the database is available
well beyond that. Sources:
[nodejs.org/dist/latest-v24.x](https://nodejs.org/dist/latest-v24.x/) (official),
[unofficial-builds.nodejs.org](https://unofficial-builds.nodejs.org/download/release/)
(extra arches), and [wekan/FerretDB releases](https://github.com/wekan/FerretDB/releases).

| Arch | Node.js 24 | MongoDB | FerretDB v1 | WeKan runs? |
| --- | --- | --- | --- | --- |
| amd64 (x64) | ✅ official | ✅ | ✅ | ✅ |
| arm64 (aarch64) | ✅ official | ✅ | ✅ | ✅ |
| ppc64le | ✅ official | ❌ | ✅ | ✅ (FerretDB) |
| s390x | ✅ official | ❌ | ✅ | ✅ (FerretDB) |
| riscv64 | ✅ unofficial (glibc) | ❌ | ✅ | ✅ (FerretDB) |
| **loong64** | ✅ unofficial (glibc) | ❌ | ✅ | ⚠️ binaries exist, but **not buildable in CI** — see below |
| **armhf / armv7l** | ❌ (source-build only, Experimental) | ❌ | ✅ | ❌ (no Node binary) |
| **armel (armv5)** | ❌ | ❌ | ✅ | ❌ (no Node binary) |
| **i386 (32-bit x86 Linux)** | ❌ (port removed) | ❌ | ✅ | ❌ (no Node binary) |

### Why `armhf` / `armv7l` is not supported

`armhf` = `armv7l` = 32-bit ARMv7 hard-float (the same thing; the `l` is
little-endian; Debian calls it `armhf`, Docker calls it `linux/arm/v7`).

Node.js **downgraded ARMv7 to "Experimental" in v24** ("Downgraded as of Node.js
24" in Node's `BUILDING.md`). That means the source still compiles for ARMv7, but
**no binaries are published or tested**. Neither nodejs.org nor
unofficial-builds ship an `armv7l` tarball for v24, and NodeSource does not ship
`armhf` for the 24.x line. Distributions (Debian, Alpine) build Node from source
for `armhf`, but their versions lag behind 24.x and are their own (often musl)
builds, not the portable glibc tarball WeKan's self-contained bundle embeds.

→ The only way to get an `armhf`/`armv7l` WeKan bundle is to **compile Node 24
from source** in CI (slow under emulation, Experimental tier, unsupported).

### Why `i386` (32-bit x86 Linux) is not supported

Node.js **removed the 32-bit x86 Linux port** years ago. There is no binary and
no practical source build. So 32-bit x86 Linux cannot run current WeKan at all,
regardless of effort. (FerretDB has an `i386` binary, but there is nothing to run
the WeKan server with.)

### Why `loong64` is not built in CI (even though binaries exist)

LoongArch64 has both a Node 24 unofficial-builds binary **and** a FerretDB v1
binary, so in principle WeKan could run on it. But the release workflow cannot
**build** the bundle/Docker image for it:

1. **QEMU cannot emulate LoongArch.** `docker/setup-qemu-action`
   ([tonistiigi/binfmt](https://github.com/tonistiigi/binfmt)) supports
   `amd64, arm64, riscv64, ppc64le, s390x, 386, arm/v7, arm/v6` — **no
   loong64**. The extra-arch bundles rebuild native modules (e.g. bcrypt) by
   running an emulated container of the target arch; with no emulator, that step
   is impossible.
2. **No official base image.** Ubuntu/Debian do not publish an official
   `linux/loong64` container image (LoongArch is a debian-ports / community
   architecture), so there is nothing to build inside.

FerretDB's own image builds for `linux/loong64` only because Go **cross-compiles**
from the amd64 builder (it never runs loong64 code at build time). WeKan's native
`.node` addons would instead need a real LoongArch build environment — a
`loongarch64-linux-gnu` cross-toolchain plus a (non-mainstream) loong64 runtime
image. That is significantly more work than the riscv64 path and is why loong64
is currently left out.

## Alternative JavaScript engines

The engine itself (V8) *can* target 32-bit — the problem is that the **Node.js
project stopped shipping those binaries** and **Meteor is bound to Node**.
Swapping the engine does not run Meteor.

| Engine / runtime | armhf / armv7 | i386 | Runs Meteor/WeKan? |
| --- | --- | --- | --- |
| **Node.js 24** (V8) | source-build only (exp.) | ❌ | — (current) |
| **Deno** (V8, Rust) | ❌ x64/arm64 only | ❌ | ❌ |
| **Bun** (JavaScriptCore, Zig) | ❌ x64/arm64 only | ❌ | ❌ |
| **QuickJS** (Bellard, pure C) | ✅ any arch | ✅ | ❌ (no Node API / npm) |
| **Duktape / MuJS / JerryScript** | ✅ | ✅ | ❌ (ES5, embeddable) |
| **JavaScriptCore / SpiderMonkey** | ✅ (WebKit/Firefox build there) | ✅ | ❌ |
| **Rhino / GraalJS** (on a JVM) | ✅ (OpenJDK armhf/i386) | ✅ | ❌ |

Two takeaways:

- The modern Node alternatives, **Deno and Bun, are *worse*** for architecture
  coverage (x64/arm64 only) — they do not help with 32-bit.
- Several engines (**QuickJS, JavaScriptCore, SpiderMonkey, JVM-based**) *do* run
  on `armhf`/`i386`, but **none run Meteor/WeKan**. Meteor requires Node.js
  specifically (V8 + libuv + Node's native APIs + Meteor's Node-based build), so
  using another engine means rewriting the server for that runtime — as large a
  job as a language rewrite.

## Full server rewrite options

If the goal is to run on architectures Node cannot reach, the server has to be
rewritten in a portable language. The browser client stays as-is; the new server
just serves the SPA, the API, reactive sync, accounts and methods, talking to
FerretDB/MongoDB.

### Go (recommended for portability)

- **Cross-compiles everywhere** — `i386`, `armv7`, `armhf`, `armel`, `loong64`,
  `mips`, … exactly as [FerretDB](https://github.com/wekan/FerretDB) already does,
  as a single static binary with no Node-ABI or native-module problems.
- Speaks the **MongoDB wire protocol natively** to FerretDB/MongoDB.
- Mature HTTP/WebSocket ecosystem for the API and reactive sync.
- **Cost:** this is effectively a **different product** — Meteor's DDP, reactive
  pub/sub, accounts, methods and client sync all have to be rebuilt. Very large
  effort.

### QuickJS (the "keep JavaScript" option)

- Pure C, compiles on virtually **any architecture**, tiny footprint.
- **Cost:** no npm ecosystem and no Node API, so the server is written against a
  minimal runtime — about as much work as the Go rewrite, with a smaller
  ecosystem and weaker performance. Niche.

### Tcl/Tk (not recommended for this)

- **Tcl** is extremely portable (pure C, builds on any arch: `i386`, `armv7`,
  `armhf`, `armv5`, `mips`, …).
- **But Tk is a desktop GUI toolkit**, not a web-server stack. WeKan is a
  **web application** (browser SPA + server + database); Tk would produce a
  native desktop window — a completely different product and UX.
- Tcl *can* run a web server (NaviServer/AOLserver, tclhttpd, Wapp), but it is a
  niche stack with no reactive-SPA story. For a web app this is a **step
  backwards** compared to Go.

### Comparison

| Option | Arch coverage | Effort | Fit for WeKan (web app) |
| --- | --- | --- | --- |
| Compile Node 24 from source (armv7 only) | + armv7 (not i386) | Medium, fragile, Experimental | Keeps Meteor; no rewrite |
| **Go server** | Universal (like FerretDB) | Very large (full rewrite) | Best; static binary, native FerretDB |
| QuickJS server | Universal | Very large | OK; keeps JS, small ecosystem |
| Tcl/Tk | Universal (Tcl) | Very large | Poor; GUI/scripting, not a web stack |

## Hardware / OS notes

These are about the **FerretDB (Go) binary** on specific targets; remember the
WeKan *server* still needs a Node.js 24 build, which is the actual blocker above.

- **ODroid-U3 (ARMv7-A, Linux)** — FerretDB `armhf` (GOARM=7) runs fine. The
  board has enough RAM for FerretDB v1; only the missing Node 24 `armhf` binary
  stops WeKan itself.
- **Raspberry Pi OS 32-bit** — FerretDB `armhf` (v7) runs on Pi 2/3/4 (ARMv7);
  Pi 1/Zero (ARMv6) need the `armel` (GOARM=5) binary. Again, the WeKan server is
  blocked only by Node.
- **ReactOS 32-bit** — the matching binary would be FerretDB `win32`
  (windows/386), but it is **doubtful**: Go 1.21+ targets Windows 10 / Server
  2016-level APIs, while ReactOS is around XP/2003, so Go's runtime may use APIs
  ReactOS does not implement. (On 32-bit *Linux* the `linux/386` FerretDB binary
  works.)

## Conclusion

- The architecture limit is **Node.js**, not FerretDB. FerretDB (Go) already runs
  on 32-bit ARM, 32-bit x86 and more.
- With current tooling, the practical WeKan set is **amd64, arm64, ppc64le,
  s390x, riscv64**. `loong64` is blocked by tooling (no QEMU emulation, no base
  image), not by Node/FerretDB. `armhf`/`armel`/`i386` are blocked by Node.
- Alternative JS engines do **not** unblock this — Deno/Bun cover fewer arches,
  and portable engines cannot run Meteor.
- The only way to universal architecture coverage is a **portable-language server
  rewrite**, for which **Go is the best fit** (matching FerretDB), QuickJS the
  "keep JS" niche option, and Tcl/Tk a poor fit for a web application.
