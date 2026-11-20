# Updating the `wekan-ondra` and `wekan-gantt-gpl` repositories

WeKan keeps two compatibility package names for users who installed earlier
Ondra and Gantt variants:

- [`wekan/wekan-ondra`](https://github.com/wekan/wekan-ondra)
- [`wekan/wekan-gantt-gpl`](https://github.com/wekan/wekan-gantt-gpl)

They contain the current WeKan source. Their distinct install and publishing
identities must remain distinct after every update.

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
`wekan`, `wekan-ondra` and `wekan-gantt-gpl`; the native amd64 and arm64 matrix
continues publishing the two compatibility snaps even though repository updates
are no longer performed inside that matrix.

There is no Docker side to this automation. Existing historical variant image
tags keep working, but they are not gaining versions; current container releases
use the ordinary WeKan image. Preserving Compose names in the mirror only keeps
the repository's package identity intact and does not publish those images.

## Local preparation

To inspect the exact changes without pushing:

```bash
./releases/prepare-variant-repo.sh \
  . .tools/wekan-ondra wekan-ondra 'Wekan Ondra'

./releases/prepare-variant-repo.sh \
  . .tools/wekan-gantt-gpl wekan-gantt-gpl 'Wekan Gantt GPL'
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

## How the three snaps reach every Snap Store channel

`wekan`, `wekan-ondra` and `wekan-gantt-gpl` are the same program under three
snap names. One run of `release-all.yml` makes all three:

| Job | Snaps | Architectures |
| --- | --- | --- |
| `snap-native` | `wekan` | amd64, arm64 |
| `snap-launchpad` | `wekan` | armhf, ppc64el, s390x, riscv64 |
| `snap-variants` | `wekan-ondra`, `wekan-gantt-gpl` | amd64, arm64 |

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
- a missing `wekan-ondra` or `wekan-gantt-gpl` snap is made from the release's
  `wekan` snap of the same architecture by `releases/snap-rename.sh`, which
  changes only `name:` and `title:` in `meta/snap.yaml` - what `snap-variants`
  changes in `snapcraft.yaml` - and attaches it;
- then it calls "Push Snap to Store" for that release.

Run with no version, it checks the newest releases
(`releases/release-missing-scan.sh`, the `scan` input says how many) and starts
itself once for each release that is missing something.
