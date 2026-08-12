# Dev: releasing the `wekan-ondra` and `wekan-gantt-gpl` snaps from release-all.yml

Goal: when `wekan/wekan`'s **release-all.yml** runs, in addition to the main `wekan`
snap it should also, for each variant repo
[`wekan/wekan-ondra`](https://github.com/wekan/wekan-ondra) and
[`wekan/wekan-gantt-gpl`](https://github.com/wekan/wekan-gantt-gpl):

1. **Replace** the variant repo's code with the newest `wekan` code (at the release tag).
2. **Modify `snapcraft.yaml`** so the snap `name:` becomes `wekan-ondra` /
   `wekan-gantt-gpl` (instead of `wekan`).
3. **Build and publish** that snap to the **Snap Store**, all channels
   **stable, candidate, beta, edge** — automatically, on every WeKan release.

This document lists **exactly which keys/secrets must be added** and the **workflow
changes** required.

## What changed 2026-07-29

Two things, both about not letting one missing permission stop everything else:

* **The snap no longer depends on the GitHub repo push.** The job used to gate
  everything on `WEKAN_REPO_TOKEN` being able to push to `wekan/<variant>` — so a
  token without write access meant **no variant snaps at all** (v10.48, v10.49
  published none). Building and publishing a snap needs only `SNAP_AUTH`. The guard
  now answers two questions: `snap` (is `SNAP_AUTH` set) decides the build and the
  publish, `sync` (may the token push) decides only whether the repository is
  updated. Every "cannot push" warning ends with *"The snap is still built and
  published"*.
* **The variant tree comes from the release tag, not from a clone of the variant
  repo.** The job checks out `wekan/wekan` at `v<version>`, rsyncs it to `variant/`,
  and seds the snap name and title into **both** `snapcraft.yaml` and
  `snapcraft-core26.yaml` (renaming only the first left the core26 file saying
  `name: wekan`). The optional push then sends that same tree to the variant repo.

Also: both variants now build on **amd64 and arm64** (the two native runners the
default snap uses), the built file's name must start with the variant snap name
before it is uploaded — a `wekan_*.snap` published from here would overwrite the
default snap — and the two repositories were synced by hand on 2026-07-29, so they
are the newest WeKan with the snap name changed and nothing else.

There is **no Docker side**. `wekan-ondra` and `wekan-gantt-gpl` are **snap
names** — they exist because a snap name cannot be changed once people have it
installed — and as Docker images they were only ever a second name for the same
image. They are not pushed to any registry: `docker pull wekanteam/wekan` (or
`quay.io/wekan/wekan`, or `ghcr.io/wekan/wekan`) is the image, and it always was.

They were tagged in the release build for two versions, and that is what removing
them is about. Three image names on three registries is nine repositories, each
with its own visibility and its own push permission, and each an independent way
for a release to fail — which v10.88 did, an hour into an emulated build:

```
ERROR: failed to push quay.io/wekan/wekan-ondra:v10.88:
  unauthorized: access to the requested resource is not authorized
```

Quay grants push per repository and the repository had just been created by the
release itself. Nothing was gained for that: the image behind the name is the one
already published under `wekan`.

The old tags stay where they are — `ghcr.io/wekan/wekan-ondra` up to v6.99.2,
`quay.io/wekan/wekan-gantt-gpl` to v4.41, `wekanteam/wekan-gantt-gpl` to v5.62 —
because deleting a published image breaks whoever pinned it. They simply stop
gaining versions. The `-t` lines are still in `release-all.yml`, commented out
with the reason beside them, and
[`docker-variant.yml`](../../../.github/workflows/docker-variant.yml) with
`releases/docker-publish-variant.sh` still exist for publishing one out of band —
they are `workflow_dispatch` only and no release calls them.

## Remaining steps

> **Status:** the `snap-variants` job **runs on every release** now — it was
> hard-disabled with `if: ${{ false }}` while it was grouped with the failing snap
> exotic-arch jobs, and that line is gone, so its output is visible in the run. It is
> still internally **guarded**: until the items below are done it logs a `::warning::`
> naming the missing secrets and skips its work, and `continue-on-error: true` means it
> can never fail a release either way. To actually publish the variant snaps, complete
> steps 1–4 below; step 5 (removing the `if`) is already done.

1. **Register the snap names** (one-time, on the machine holding the WeKan Snap Store
   account): `snapcraft register wekan-ondra` and `snapcraft register wekan-gantt-gpl`.
2. **Create/confirm** the GitHub repos `wekan/wekan-ondra` and `wekan/wekan-gantt-gpl`
   (each is overwritten with the newest `wekan` code on every release — make sure nothing
   unique lives only there).
3. **Re-export Snap Store credentials** covering all three names, then update `SNAP_AUTH`:
   ```sh
   snapcraft export-login --snaps wekan,wekan-ondra,wekan-gantt-gpl \
     --acls package_access,package_push,package_release,package_update snap-auth.txt
   gh secret set SNAP_AUTH --repo wekan/wekan < snap-auth.txt
   ```
4. **Extend `WEKAN_REPO_TOKEN`** so it can push the newest `wekan` code into the two
   variant repos. **The stored secret value never changes** — you only widen the token's
   repo scope on GitHub, so there is **no** `gh secret set WEKAN_REPO_TOKEN` step. How you
   do it depends on the token type:

   - **Classic PAT (scope `repo`)** — already covers *every* org repo its owner can write
     to, so there is usually **nothing to change on the token**. Just make sure the two
     repos exist (step 2) and the token owner (the WeKan account) has **Write** (or Admin)
     on both — automatic if they are a `wekan` org owner/admin, otherwise add them as a
     collaborator with Write. Do **not** re-store the secret.
   - **Fine-grained PAT** — only reaches **explicitly selected** repos, so you must edit it:
     GitHub → account **Settings → Developer settings → Personal access tokens →
     Fine-grained tokens** → open the token used as `WEKAN_REPO_TOKEN` → **Repository
     access** → *Only select repositories* → add `wekan-ondra` and `wekan-gantt-gpl` (or
     *All repositories*) → confirm **Permissions → Repository permissions → Contents:
     Read and write** → **Update token**. The token string is unchanged, so the secret is
     not re-stored.
   - **Deploy-key alternative** — instead of widening one PAT, add a **write deploy key**
     to each variant repo and store the private keys as `ONDRA_DEPLOY_KEY` /
     `GANTT_DEPLOY_KEY` (more secrets, but each is scoped to exactly one repo). See §2.

   Verify the scope is right with a throwaway push, e.g.
   `git push https://x-access-token:<token>@github.com/wekan/wekan-ondra HEAD:refs/heads/scope-test`
   should succeed (not 403); then delete the test branch.
5. **Re-enable the job** — remove the `if: ${{ false }}` line from the `snap-variants` job
   in `.github/workflows/release-all.yml`. With steps 1–4 done and the `if` removed, the
   next release publishes both variant snaps to stable/candidate/beta/edge. (If the store
   ACL or repo token is still missing, the job skips itself with a `::notice::` rather than
   failing the release.)

**How to add/update a secret:** GitHub → the `wekan/wekan` repo → **Settings → Secrets and
variables → Actions → New repository secret**; or the CLI `gh secret set NAME --repo
wekan/wekan` (paste the value) or `gh secret set NAME --repo wekan/wekan < file`.

The reference details (name registration, ACLs, the workflow job, snapcraft.yaml edits)
are in §1–§7 below.

---

## How the current `wekan` snap release works (baseline)

From `.github/workflows/release-all.yml`:

- `snapcraft.yaml` has `name: wekan`, `version: '<x.yy>'`, `base: core24`.
- Snap Store auth is the secret **`SNAP_AUTH`** (the output of
  `snapcraft export-login`), consumed by **`snapcore/action-publish@v1`** with
  `release: stable,candidate,beta,edge`.
- The snap is built by `snapcore/action-build@v1` (amd64/arm64 native) — see the
  `snap-native` job. (ppc64el/s390x/riscv64 go via QEMU/Launchpad; see
  [Snap-Core.md](Forks/Snap-Core.md).)
- Cross-repo pushes already exist: the secret **`WEKAN_REPO_TOKEN`** (a GitHub PAT
  with write access to *other* `wekan/*` repos) is used to check out and push to the
  website/charts repos. The variant repos will reuse this exact pattern.

The **snap name** is whatever `snapcraft.yaml` says at build time — so producing a
differently-named snap is just "edit `name:` before building", and publishing it to a
different Snap Store listing requires only that (a) the name is **registered** and
(b) the store credentials have **ACL** for that name.

---

## 1. One-time manual prerequisites (done once, outside CI)

These cannot be automated in the workflow; do them once with the `wekan` Snap Store
account and the GitHub org owner:

### 1a. Register the two snap names on the Snap Store
```sh
snapcraft register wekan-ondra
snapcraft register wekan-gantt-gpl
```
The names must be available to (or already owned by) the WeKan snap account. Until a
name is registered, publishing it fails. (If a name is taken by someone else, file a
name dispute at https://snapcraft.io/ .)

### 1b. Export Snap Store credentials that can publish ALL THREE names
The current `SNAP_AUTH` macaroon is (likely) scoped to the `wekan` snap only. Re-export
a login whose ACL covers `wekan` **and** both variants:
```sh
snapcraft export-login --snaps wekan,wekan-ondra,wekan-gantt-gpl \
  --acls package_access,package_push,package_release,package_update \
  snap-auth-all.txt
```
Then update the GitHub secret from that file (see §2). Alternatively, keep `SNAP_AUTH`
for `wekan` and add **separate** per-variant secrets (`SNAP_AUTH_ONDRA`,
`SNAP_AUTH_GANTT`) each scoped to one name — slightly safer blast radius, one more
secret each.

### 1c. Ensure the two GitHub repos exist and are writable by the token
`wekan/wekan-ondra` and `wekan/wekan-gantt-gpl` must exist. The push token (§2) must
have **write (contents)** access to both. Because step 2 of the goal **overwrites**
their code, confirm nothing unique lives only in those repos (the workflow will replace
their tree with `wekan`'s).

---

## 2. GitHub secrets / keys to add (repository or org level, `wekan/wekan`)

| Secret | New or existing | What it is | Why |
|---|---|---|---|
| **`WEKAN_REPO_TOKEN`** | **extend existing** | GitHub PAT (classic: `repo`; or fine-grained: **Contents: Read/Write**) whose repo scope **includes `wekan/wekan-ondra` and `wekan/wekan-gantt-gpl`** | To push the newest `wekan` code into the two variant repos. It already exists for website/charts — just add the two repos to its scope. |
| **`SNAP_AUTH`** | **re-export (widen ACL)** | `snapcraft export-login` macaroon with ACL over `wekan,wekan-ondra,wekan-gantt-gpl` | So `snapcore/action-publish` can push the variant snaps, not just `wekan`. |
| `SNAP_AUTH_ONDRA` / `SNAP_AUTH_GANTT` | **optional alternative** | Per-name `export-login` macaroons | If you prefer separate, narrowly-scoped store credentials per variant instead of one widened `SNAP_AUTH`. |

No other new keys are required — the build uses `snapcore/action-build` (no secret) and
the GitHub Release upload uses the built-in `GITHUB_TOKEN`.

> **Fine-grained PAT note:** a fine-grained token is limited to repos you explicitly
> select — you must add `wekan-ondra` and `wekan-gantt-gpl` to the token's selected
> repositories, or the push 403s. A classic `repo`-scoped PAT covers all org repos the
> user can write.

> **Deploy-key alternative:** instead of one PAT, add a **write deploy key** to each
> variant repo and store the private keys as `ONDRA_DEPLOY_KEY` / `GANTT_DEPLOY_KEY`.
> More secrets, but each key is scoped to exactly one repo.

---

## 3. Workflow changes in `release-all.yml`

Add one **matrix job** that runs after `prepare` (which outputs the version) and does
sync → rename → build → publish per variant. It reuses the existing snap build/publish
actions; only the `name:` edit and the code-sync are new.

```yaml
  # ─── Variant snaps: wekan-ondra, wekan-gantt-gpl ────────────────────────────
  # Overwrite each variant repo with the newest wekan code at the release tag,
  # rename the snap in snapcraft.yaml, build it, and publish all channels.
  snap-variants:
    needs: [prepare, release]        # release = the main GitHub Release exists
    continue-on-error: true          # a variant must never block the main release
    timeout-minutes: 60
    strategy:
      fail-fast: false
      matrix:
        include:
          - repo: wekan-ondra
            snapname: wekan-ondra
            title: "Wekan Ondra"
          - repo: wekan-gantt-gpl
            snapname: wekan-gantt-gpl
            title: "Wekan Gantt GPL"
    runs-on: ubuntu-latest
    env:
      VERSION: ${{ needs.prepare.outputs.version }}
    steps:
      # 1. Check out the newest wekan code at the release tag.
      - name: Checkout wekan at the release tag
        uses: actions/checkout@v7
        with:
          ref: refs/tags/v${{ needs.prepare.outputs.version }}
          path: wekan

      # 2. Replace the variant repo's code with wekan's, then commit/tag/push.
      - name: Sync wekan code into ${{ matrix.repo }} and push
        env:
          GH_TOKEN: ${{ secrets.WEKAN_REPO_TOKEN }}
        run: |
          set -euo pipefail
          git clone "https://x-access-token:${GH_TOKEN}@github.com/wekan/${{ matrix.repo }}.git" variant
          # Replace tracked content with wekan's tree (keep the variant's .git).
          rsync -a --delete --exclude='.git' wekan/ variant/
          cd variant
          # 3. Rename the snap in snapcraft.yaml (name + human title).
          sed -i "s/^name: wekan$/name: ${{ matrix.snapname }}/" snapcraft.yaml
          sed -i "s/^title: .*/title: ${{ matrix.title }}/" snapcraft.yaml
          git config user.name  'wekan-release-bot'
          git config user.email 'release@wekan.team'
          git add -A
          git commit -m "Sync wekan v${VERSION} and set snap name ${{ matrix.snapname }}" || echo "no changes"
          git tag -f "v${VERSION}"
          git push origin HEAD:main
          git push -f origin "v${VERSION}"

      # 4. Build the renamed snap (native amd64; add arm64 runner if desired).
      - name: Build the ${{ matrix.snapname }} snap
        id: build
        uses: snapcore/action-build@v1
        with:
          path: variant

      # 5. Publish to the Snap Store, all channels.
      - name: Publish ${{ matrix.snapname }} to the Snap Store
        uses: snapcore/action-publish@v1
        env:
          SNAPCRAFT_STORE_CREDENTIALS: ${{ secrets.SNAP_AUTH }}
        with:
          snap: ${{ steps.build.outputs.snap }}
          release: stable,candidate,beta,edge
```

Notes on the job above:

- **Multi-arch:** the snippet builds one arch (the runner's, amd64). To match the main
  `wekan` snap's arch coverage, replicate the arch strategy from `snap-native`
  (amd64 + arm64 native runners) and, if needed, `snap-launchpad` for
  ppc64el/s390x/riscv64 — parameterized by `snapname`. Most users are amd64/arm64.
- **Credentials:** if you chose per-variant secrets (§2), replace `secrets.SNAP_AUTH`
  with `secrets.SNAP_AUTH_ONDRA` / `secrets.SNAP_AUTH_GANTT` via the matrix.
- **Version:** `snapcraft.yaml`'s `version:` is already correct because the code came
  from the wekan release tag — no version edit needed (the main release's `bump` job
  already set it).
- **Destructive push:** `rsync --delete` + `git push origin HEAD:main` makes the variant
  repo a mirror of `wekan`. If a variant must keep its own README/patches, exclude them
  in the `rsync` (`--exclude`) or apply a patch step after the sync.

---

## 4. What actually gets modified in `snapcraft.yaml`

Only the identity lines change; everything else (base, confinement, parts, apps) is
inherited from `wekan` unchanged:

```diff
- name: wekan
+ name: wekan-ondra          # or wekan-gantt-gpl
- title: Wekan
+ title: Wekan Ondra         # or Wekan Gantt GPL
```

Optionally also customize `summary:`/`description:`/`icon:` per variant for a distinct
Snap Store listing. `version:` stays as the shared WeKan version.

---

## Checklist

- [ ] `snapcraft register wekan-ondra` and `snapcraft register wekan-gantt-gpl` (§1a)
- [ ] Re-export `SNAP_AUTH` with ACL for all three names — or add `SNAP_AUTH_ONDRA` /
      `SNAP_AUTH_GANTT` (§1b, §2)
- [ ] Extend `WEKAN_REPO_TOKEN` scope to include both variant repos — classic `repo` PAT
      needs nothing changed (just org write access); fine-grained PAT must add the two repos
      with Contents: Read/Write — or add per-repo deploy keys. The secret value is unchanged
      either way (§1c, §2, Remaining step 4)
- [ ] Confirm the two variant repos hold nothing that must survive the overwrite (§1c)
- [x] The `snap-variants` job is in `release-all.yml` (§3) and its `if: ${{ false }}`
      line is removed, so it runs on every release (Remaining step 5)
- [ ] Run one release and verify both snaps appear at
      `https://snapcraft.io/wekan-ondra` and `https://snapcraft.io/wekan-gantt-gpl`
      in all four channels

## See also

- [Snap-Core.md](Forks/Snap-Core.md) — snap multi-arch
  build constraints (core24 vs the QEMU action).
- [Linux.md](OS/Linux.md) — Snap in the broader Linux update picture.
