# WeKan on Alpine and other musl systems

Alpine Linux, and every other Linux built on musl instead of glibc, cannot run
the ordinary Linux bundle: its Node.js and native addons are built for glibc.
Every release therefore also has, for x64 and arm64:

| Asset | What it is |
| --- | --- |
| `wekan-<version>-linux-x64-musl.zip`, `wekan-<version>-linux-arm64-musl.zip` | the Linux bundle rebuilt for musl, with FerretDB - start it with `bundle/start-wekan.sh`, like the ordinary bundle |
| `WeKan-<version>-x86_64-musl.AppImage`, `WeKan-<version>-aarch64-musl.AppImage` | the same as an AppImage |
| `wekan-<version>-bun-linux-x64-musl-single-file`, `...-arm64-musl-...` | one executable on Bun; bring your own MongoDB-compatible database ([Single file](../../Single-File.md#bun-single-files)) |
| `wekan-<version>-bun-linux-x64-musl.zip`, `...-arm64-musl.zip` | the Bun bundle ([Bun](../../../../releases/bun/README.md)) |

On Alpine, an AppImage needs FUSE (`apk add fuse`), or runs without it with
`APPIMAGE_EXTRACT_AND_RUN=1 ./WeKan-<version>-x86_64-musl.AppImage`.

## How the musl bundle is made

`.github/workflows/musl.yml` takes the release's own Linux bundle of that CPU
and, inside Alpine on a runner of the same CPU
(`releases/musl/build-bundle.sh`):

- puts in the musl Node.js of exactly the bundle's version, checked against
  its published SHA256, and removes the glibc libraries of `node-runtime`;
- reinstalls the server's npm packages, so every native addon is compiled
  against musl and sharp's musl package is the one installed;
- checks every native addon's architecture and that sharp loads;
- starts the bundle as a user starts it and requires HTTP 200 before it is
  published.

FerretDB and the MongoDB Database Tools are static Go programs and are the
same as in the ordinary bundle. `tests/muslBundles.test.cjs` checks the build,
the workflow and the AppImage variants.
