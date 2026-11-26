# Updating the `wekan-ondra` repository

WeKan keeps one compatibility package name for users who installed the earlier
Ondra variant:

- [`wekan/wekan-ondra`](https://github.com/wekan/wekan-ondra)

It contains the current WeKan source. Its distinct install and publishing
identity must remain distinct after every update.

`wekan-gantt-gpl` is no longer built or published - not as a snap, not as a
Docker image: its users moved to the official `wekan` snap, and
[`wekan/wekan-gantt-gpl`](https://github.com/wekan/wekan-gantt-gpl) is archived.
To move from it, install `wekan` (`sudo snap install wekan`) and restore a
backup of the `wekan-gantt-gpl` data into it.

## Moving from wekan-ondra to wekan

`wekan-ondra` is still published, and its Snap Store page recommends the
official `wekan` snap. [migrate-wekan-ondra-to-wekan.sh](migrate-wekan-ondra-to-wekan.sh)
makes the move on the server:

```
sudo snap run wekan-ondra.database-backup
curl -fsSLO https://raw.githubusercontent.com/wekan/wekan/main/docs/Platforms/FOSS/Container/Snap/migrate-wekan-ondra-to-wekan.sh
sudo bash migrate-wekan-ondra-to-wekan.sh --dry-run
sudo bash migrate-wekan-ondra-to-wekan.sh
```

The dry run shows every command and changes nothing. The move then:

1. installs `wekan` from the channel `wekan-ondra` tracks (`--channel` picks
   another), or refreshes it when it is older than `wekan-ondra` - the data
   moves forward, never back, so an older `wekan` is refused;
2. sets every setting of `wekan-ondra` on `wekan` (`snap get -d`, then
   `snap set`), a path under `/var/snap/wekan-ondra/` becoming `wekan`'s;
3. stops and disables `wekan-ondra`: the two use the same ports (WeKan 8080,
   MongoDB 27019, Caddy 3001), so only one runs;
4. moves `wekan`'s own data aside to `/var/snap/wekan/common.before-wekan-ondra-<time>`
   and copies `/var/snap/wekan-ondra/common` - the database, attachments,
   avatars and Caddyfile - in its place;
5. starts `wekan`.

`wekan-ondra` stays installed with its data where it was. Check WeKan in the
browser, then `sudo snap remove wekan-ondra`. To undo before that:

```
sudo snap stop --disable wekan
sudo snap start --enable wekan-ondra
```

It needs `python3` or `jq` to read the settings. `tests/snapOndraMigrate.test.cjs`
runs it against a fake `snap` command: the settings, the data, the order of
stopping and starting, and that no wekan-ondra, an older wekan, a refused
question, a dry run and a non-root run change nothing.

## Automated update

`.github/workflows/update-ondra-gantt-repos.yml` can run manually against
`main`. `release-all.yml` also calls it with the newly created release tag, so
the repository contents match the source used for that release.

The reusable workflow checks out each target repository and runs
`releases/prepare-variant-repo.sh`. That script replaces the target's tracked
tree with the committed WeKan source and restores these variant-specific values:

- both Snapcraft files' snap name, title and source repository;
- the root npm name in `package.json` and `package-lock.json`;
- the source label in `Dockerfile`;
- GHCR, Quay and Docker Hub image names in every Compose example.

The preparation step removes `.github/dependabot.yml` and
`.github/dependabot.yaml`. Dependencies are updated, reviewed and tested once
in `wekan/wekan`, then copied to both mirrors. Running Dependabot independently
in the mirrors creates duplicate PRs based on source snapshots that the next
sync replaces.

The script refuses an unsupported package name or a target checkout with local
changes. It copies `git archive HEAD`, so `.git`, `.tools`, ignored files,
uncommitted changes and build output cannot enter a variant repository.

## Required credentials

`WEKAN_REPO_TOKEN` must be able to read and write repository contents for both
target repositories. A fine-grained token needs both repositories selected and
**Contents: Read and write** permission. A classic token needs the `repo` scope
and its account must have write access to both repositories.

Repository synchronization is a required, separately visible release job. A
missing or insufficient token therefore fails that job instead of silently
leaving the repositories stale.

Snap publication remains independent. `SNAP_AUTH` must include permission for
`wekan` and `wekan-ondra`; the native amd64 and arm64 matrix continues
publishing the compatibility snap even though repository updates are no longer
performed inside that matrix.

## Architectures and channels

`wekan-ondra` is published on every architecture the
`wekan` snap has - amd64, arm64, armhf, ppc64el, s390x and riscv64 - and each
revision is released to `stable`, `candidate`, `beta` and `edge`, exactly like
`wekan`. Until this was changed it had amd64 and arm64 only, so people on the
other architectures stayed on whatever the store last had.

| Architectures | Made by (`release-all.yml`) |
| --- | --- |
| amd64, arm64 | `snap-variants`: built natively from the release tag, with only `name:` and `title:` of `snapcraft.yaml` changed |
| armhf, ppc64el, s390x, riscv64 | each `snap-launchpad` leg: the `wekan` snap that leg just built on Launchpad, renamed with `releases/snap-rename.sh` (`name:` and `title:` in `meta/snap.yaml`, nothing else) |

Renaming rather than building again is deliberate: a variant is the same program
under another snap name, and a Launchpad build of an architecture with no
native GitHub runner takes hours. Every variant snap is attached to the GitHub
Release, and the last snap job, **Push Snap to Store** (`snap-store.yml`),
releases what the release carries to all four channels. When the release has a
`wekan` snap of an architecture but not the variant of it, that workflow and
**Release All Missing** make the variant from it the same way, so a leg that
failed half way is finished from the release itself.

There is no Docker side to this automation. Existing historical variant image
tags keep working, but they are not gaining versions; current container releases
use the ordinary WeKan image. Preserving Compose names in the mirror only keeps
the repository's package identity intact and does not publish those images.

## Local preparation

To inspect the exact changes without pushing:

```bash
./releases/prepare-variant-repo.sh \
  . .tools/wekan-ondra wekan-ondra 'Wekan Ondra'
```

Review `git status` and `git diff` in each target checkout before committing.
The automated workflow performs the equivalent operation and pushes `main` only
when the prepared tree differs.

## Why the repositories previously stayed stale

The old implementation put repository synchronization inside the
`snap-variants` matrix, whose job has `continue-on-error: true`. Synchronization
also had its own optional token preflight. Consequently the Snap Store steps
could succeed while a repository push was skipped or failed, and the overall
release still appeared successful.

Keeping synchronization in a required reusable workflow gives it one clear
result per repository and avoids attempting the same source update from
architecture-specific snap jobs.

## How the two snaps reach every Snap Store channel

`wekan` and `wekan-ondra` are the same program under two snap names. One run
of `release-all.yml` makes both:

| Job | Snaps | Architectures |
| --- | --- | --- |
| `snap-native` | `wekan` | amd64, arm64 |
| `snap-launchpad` | `wekan` | armhf, ppc64el, s390x, riscv64 |
| `snap-variants` | `wekan-ondra` | amd64, arm64 |

Each job uploads its snap with `--release` to stable, candidate, beta and edge,
and attaches it to the GitHub Release. Until v13.21 `snap-variants` did not
attach its snaps, so older releases carry only `wekan_*.snap`.

The Snap Store can keep an upload "processing" for hours and then not release
it: on v13.20 every snap job was green and the store kept the old version. So
the last snap job of the release, `snap-store`, calls
`.github/workflows/snap-store.yml` ("Push Snap to Store") for the release tag.
For every snap on the release it runs `releases/snap-store-push.sh`, which
releases a revision the store already has by number, uploads one it has not,
uploads again after a store-side failure ("Error checking upload
uniqueness", HTTP 5xx), waits for one still processing, and is red when a snap
did not reach its channels. "Push Snap to Store" also runs by hand from the
Actions tab, for any release tag.

`release-all-missing.yml` finishes a release that lacks snaps:

- the `wekan` snaps come from retrying the release's own `snap-native` or
  `snap-launchpad` job (its `recover` job);
- a missing `wekan-ondra` snap is made from the release's
  `wekan` snap of the same architecture by `releases/snap-rename.sh`, which
  changes only `name:` and `title:` in `meta/snap.yaml` - what `snap-variants`
  changes in `snapcraft.yaml` - and attaches it;
- then it calls "Push Snap to Store" for that release.

Run with no version, it checks the newest releases
(`releases/release-missing-scan.sh`, the `scan` input says how many) and starts
itself once for each release that is missing something.

## When the Snap Store holds a revision for review

The store can keep an uploaded revision in its manual review queue. On the
snap's dashboard (`https://dashboard.snapcraft.io/snaps/<name>/`, Releases)
it is listed under "Revisions available to release" as **Can't be released:
ReviewQueued**. That happened to `wekan` (revision 4793) and `wekan-gantt-gpl`
(revision 913) on v13.21, while `wekan-ondra`, built from the same tag with
only its name changed, was released.

While a revision is held:

- uploading the same file again answers "Error checking upload uniqueness":
  the store takes a file only once. "Push Snap to Store" therefore asks the
  store first (`snapcraft revisions`; snapcraft 9 renamed `list-revisions`,
  whose failure made v13.20 and v13.21 upload again and again), releases a
  revision it already has, uploads a file at most once, and after the
  uniqueness answer releases the store's revision or says it is held;
- every release goes to each channel on its own (stable, candidate, beta,
  edge), so a channel the store refuses does not keep the revision out of the
  others, and each refusal is an error line in the build log; the workflow
  also releases the newest revision of every architecture the store has
  (`releases/snap-store-release-newest.sh`), whatever the GitHub release
  holds;
- no upload or release command can skip the review. Ask for it at
  <https://forum.snapcraft.io/c/store-requests/>, naming the snap and the
  revision, then run "Push Snap to Store" again: it releases the reviewed
  revision to every channel.

"Push Snap to Store" also makes a missing `wekan-ondra`
snap from the release's `wekan` snaps (`releases/snap-rename.sh`), so a
release cut before the variants were attached can still be pushed.
