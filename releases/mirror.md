# WeKan mirror design and operation

Design updated: **2026-09-13**.

`releases/mirror.sh` runs `mirror-gitlab.sh`, `mirror-codeberg.sh` and
`mirror-sourceforge.sh`. Only uncommented `mirror "name" "URL"` calls select
active targets; Bitbucket remains disabled. `releases/mirror.bat` and the
corresponding per-mirror `.bat` scripts run the same Node engine on Windows.
Build menu **Tools → Mirror repo to forges** calls this flow on both platforms.
The common implementation is `tools/mirror-active-forges.mjs`; persistent local
files are managed by `tools/mirror-archive.mjs`.
Projects and wiki are excluded.

Run these commands yourself from the checkout:

```sh
# Read-only preview of all active destinations:
bash releases/mirror.sh --preview
# Copy missing data and synchronize Git branches/tags:
bash releases/mirror.sh
# One destination, using a fresh GitHub snapshot:
bash releases/mirror-codeberg.sh
```

On Windows, use `releases\mirror.bat --preview`, then `releases\mirror.bat`.
`node tools/mirror-active-forges.mjs` is a read-only data preview; `--apply`
copies missing data and `--code` includes branches/tags. `--target` selects one
active mirror. Git updates do not force changes or delete destination refs.
When destination `main` has merge commits from older mirror runs, the tool
merges destination and GitHub `main` in `.tools/wekan-<mirror>` and pushes the
combined history. It inherits the root checkout's Git author identity, preserves
local changes, and aborts conflicting merges. Other divergent branches/tags
are reported for manual resolution.
Run the forge CLI installer in the build menu first on a new machine.

The all-mirror launcher reads one fresh, fully paginated GitHub snapshot for
the run, archives its files once, then passes the snapshot to each destination. Individual scripts read a fresh snapshot when run separately. The
snapshot includes open/closed issues and PRs, issue comments, inline
review comments and review summaries, labels, milestones, releases and their
fully paginated assets.

| Data | GitLab | Codeberg | SourceForge |
| --- | --- | --- | --- |
| Code, branches, tags, workflow source files | Git | Git | Git |
| Issues and closed state | Native issues | Native issues | Tracker tickets |
| PRs | Linked issues with branch/patch information | Same | Same |
| Issue comments, review summaries and inline comments | Native comments | Native comments | Tracker discussion posts |
| Labels and milestones | Create missing native entries | Create missing native entries | Labels; milestone link in ticket text |
| Published release notes | Native releases | Native releases | `README.md` in file release directory |
| Release binaries | Project uploads linked to release | Native release attachments | SFTP file releases |

Authenticate `gh`, `glab` and `tea` separately. For Codeberg binary uploads,
set `CODEBERG_TOKEN` or `GITEA_TOKEN` with repository write permission; metadata
uses the Tea login. `WEKAN_CODEBERG_LOGIN` optionally selects its login name.
GitLab uploads use `GITLAB_TOKEN`, `GLAB_TOKEN`, `OAUTH_TOKEN` or the existing
GitLab login through `glab api --form`. Use current versions of the forge CLIs.
GitHub asset downloads use the authenticated `gh api` command and verify file
size and the SHA-256 digest when GitHub provides one. File bodies stream to disk;
uploads use Node's filesystem-backed Blob without loading the entire binary
into memory. HTTP binary uploads default to a one-hour timeout; set
`WEKAN_MIRROR_UPLOAD_TIMEOUT_MS` to adjust it.

SourceForge tracker writes need `SOURCEFORGE_TOKEN`, an OAuth bearer token from
the account's OAuth page. The script discovers an existing Tracker tool. When
there are several, select its mount point with `WEKAN_SOURCEFORGE_TRACKER`.
If no Tracker exists, apply mode tries the Allura admin API to install one at
`github-issues` (or the configured mount), then verifies it exists before copying
tickets. This needs project administrator permission. Preview only lists the
planned tool. Existing tools are preserved; projects and wiki are never copied.
Nonstandard
tracker states can be selected with `WEKAN_SOURCEFORGE_OPEN_STATUS` and
`WEKAN_SOURCEFORGE_CLOSED_STATUS` (defaults `open` and `closed`). SFTP needs working
SSH authentication and a known host entry; batch mode fails rather than asking
for a password. `WEKAN_SOURCEFORGE_USER` defaults to `wekan`.

SourceForge release files go under `/home/frs/project/wekan/GitHub-releases/`.
Tag/asset names have a readable sanitized prefix and a hash to avoid collisions
and unsafe SFTP path characters. Common archive/package filename suffixes are
retained. Each release includes `mirror.json` mapping
original filenames, sizes, digests and URLs. Uploads use `.part`, then rename
after success; a partial file is retried on the next run.

Issues and comments use a GitHub URL marker, never a title, as their identity.
The previous tool's `Mirrored from …` footer is recognized. Existing releases
match by Git tag; their text is preserved. Removing a mirror's provenance can
prevent issue matching, so retain its marker/footer. Existing human text and
source-open destination issue states are preserved. Source-closed mirrored
issues are closed, including after an interrupted first import. New comments
and assets are checked even when the parent already exists. Previously failed
copies are attempted again on the next run. An inventory failure stops writes
to that category rather than assuming it was empty. Other categories and mirrors
continue, and any failures/conflicts produce a nonzero exit status.

Console status, `status.txt`, `report.json` and the GitHub snapshot are saved in
`.tools/log/mirror-<timestamp>/`. Reports list copied/planned/checked items,
archive renames and each failure reason. Transfer files stay in `.tools/tmp`;
completed source files remain in the persistent archive below. Available archived
release binaries are reused for destination uploads. SourceForge also receives
the archived source ZIP/tarball files. Archive failures are reported and later
mirrors still attempt supported data; the overall launcher returns failure.

## Persistent files, additions and history

Files live under the source issue number or release version, independently of
the destination forge:

```text
.tools/mirror/
  issues/1234/
    issue.json
    README.md
    comments.json
    attachment-<url-hash>-ORIGINALFILENAME
    mirror-index.json
    old-YYYY-MM-DD_HH-MM-SS-ORIGINALFILENAME
  pulls/1234/
    issue.json              # GitHub issue-shaped PR metadata
    pull-request.json
    reviews.json
    comments.json
    README.md
    pull-request.patch
    attachment-<url-hash>-ORIGINALFILENAME
    mirror-index.json
    old-YYYY-MM-DD_HH-MM-SS-ORIGINALFILENAME
  releases/10.00/
    release.json
    README.md
    ORIGINALFILENAME        # every GitHub release asset
    source-code.zip
    source-code.tar.gz
    mirror-index.json
    old-YYYY-MM-DD_HH-MM-SS-ORIGINALFILENAME
```

A tag `v10.00` uses directory `10.00`; other tags retain a Windows-safe tag
name. Different tags that normalize to the same directory receive a hash suffix
so their files cannot overwrite each other. Issue and pull request directories use the exact
GitHub issue/PR number, under `issues/` and `pulls/` respectively. Windows-reserved names and invalid characters are
normalized. Release filenames are kept where representable; an asset conflicting
with metadata or another filename receives its GitHub asset ID prefix. Issue
attachments receive a URL hash prefix so identical filenames from different
comments remain separate. Original names and URLs remain in the JSON metadata.
HTTP Content-Disposition filenames are used for UUID attachment URLs when
available; common image types receive an extension when necessary.

`mirror-index.json` records current file identities, names, source URLs, sizes,
SHA-256 hashes, local timestamps and HTTP cache validators. Source metadata is
saved as JSON with two-space indentation. Issue text and release notes are also
readable in `README.md`. GitHub-hosted file/image attachments are found in issue
bodies, issue comments and reviews. PR patch files and release source
archives are downloaded as well as uploaded release binaries. No files are
unpacked or executed. External website links remain in the source JSON/Markdown.

On every normal run, new source files are added and missing local files are
retried. An unchanged immutable GitHub asset with matching local metadata is
reused. Attachments, patches and source archives use conditional HTTP requests
where the server provides ETag/Last-Modified; changed bytes are downloaded and
recorded. Downloads verify transfer length and release asset size/digest.
Repository source archives use GitHub's codeload file service directly, avoiding
unauthenticated REST API requests used only to obtain archive redirects.
A failed transfer preserves the current archived copy, is reported and retries
on the next run; a stale failed-refresh binary is excluded from upload reuse.

When a complete source inventory no longer contains a managed file, its existing
local file is renamed to **`old-YYYY-MM-DD_HH-MM-SS-ORIGINALFILENAME`**, using local
time. The same history rule preserves prior metadata and binary versions before
replacement. A timestamp collision adds `.1`, `.2`, etc. to the historical name.
Old versions are never deleted. If a whole issue or release disappears from a
complete snapshot, all its managed current files are renamed and its index is
marked `sourceMissing`; the directory and history stay in place. An HTTP 404/410
for a referenced attachment is recorded as unavailable and its current copy is
retired under the same old-name rule. Network errors are reported separately.
User-added untracked files are preserved. A failed source listing is never
interpreted as an empty inventory. Corrupt indexes stop changes to that item.

Replacements are completely written/copied to an incoming file before retiring
the current version. A new GitHub asset ID reusing an old filename first retires
the removed identity, then installs the new file. This prevents accidentally
renaming the replacement as if it were the removed asset. Successful temporary
transfer files can be cleaned up; persistent archive files are never deleted.
Interrupted incoming archive files are also retained under old names.

A temporary PID lock serializes archive writers. A stale lock from a stopped
process is recovered on a later run; an active writer or unexpected lock contents
are reported. The lock stays in `.tools/tmp`, outside the persistent files.

Preview mode lists archive work without downloading or changing archive files.
For a local archive update without destination writes, run:

```sh
node tools/mirror-active-forges.mjs --archive-only --apply
```

The archive can be large when retaining all releases and historical versions.
It remains gitignored and Meteor-ignored under `.tools/`.


The tool reports its practical scope. Original authors and timestamps appear
in provenance, rather than creating accounts or impersonating authors. It does
not recreate reactions, votes or native PR approval identities, or copy Actions
execution logs, secrets or executable CI conversion. Archived issue attachment
binaries are kept locally; attachment/image URLs remain in destination Markdown.
Draft releases are archived locally and are not published at destinations. This is additive
synchronization, not an exact backup of every GitHub feature.

Offline fixtures verify pagination, URL-based matching, restart behavior,
comment/asset retries, target inventory failures, platform launchers, archive
file contents, removed/replaced filenames, source-item removal, HTTP conditional
requests and preservation of old bytes. No live
remote writes are part of those tests. Live permissions, limits and forge
configuration still need verification in a maintainer-run preview/apply run.

API references: [GitHub source archives](https://docs.github.com/en/rest/repos/contents#download-a-repository-archive-zip),
[GitLab releases](https://docs.gitlab.com/api/releases/),
[Gitea API](https://docs.gitea.com/api/1.24/),
[Allura tracker API](https://forge-allura.apache.org/rest-api-docs/),
[SourceForge file transfers](https://sourceforge.net/p/forge/documentation/Release%20Files%20for%20Download/).

GitHub Discussions are disabled in WeKan and are never fetched or mirrored.
Issue comments and pull request reviews are separate supported data. Projects
and wiki are also excluded.
