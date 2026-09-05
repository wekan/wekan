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
