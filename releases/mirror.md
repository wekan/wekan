# WeKan mirror design and operation

Design updated: **2026-09-13**.

With no arguments, `releases/mirror.sh` and `releases/mirror.bat` open the same
eight-action menu:

1. Sync newest data from source to destination mirrors.
2. Select source.
3. Select active mirrors.
4. Check source and mirror Git/API access.
5. Check where data is not mirrored yet.
6. Exit.
7. Mirror every repository of the selected GitHub organization.
8. Add, edit, remove or select organizations.

GitHub is the default source; GitLab, Codeberg and SourceForge are the default
mirrors. The source selector supports all four forges. Changing source removes
it from active mirrors and adds the previous source as a destination. The mirror
selector accepts comma-separated numbers, `none`, or blank to cancel. Choices
are saved immediately to `.tools/mirror/settings.txt` and reloaded next time:

```text
version=1
source=github
mirrors=gitlab,codeberg,sourceforge
```

The source cannot also be a mirror. Invalid, duplicate or unknown settings fail
instead of silently choosing another destination. All mirrors may be disabled;
sync then asks for an active destination. The uncommented registry in
`releases/mirror.sh` supplies defaults until settings exist. Bitbucket is inactive.
On Unix the menu delegates to separate `mirror-github`, `mirror-gitlab`,
`mirror-codeberg` and `mirror-sourceforge` `.sh` scripts. On Windows it invokes
their shared Node engine directly with the same target/code/apply flags; paths
remain separate arguments rather than command-shell text. The `.bat` wrappers
remain available for direct human use. Preview never includes `--apply`.
The menu command runner permits only its current Node executable and fixed
`bash` interpreter, always with `shell: false`. Archive hosts use an exact
string allowlist; URLs, lookalike domains and path components are rejected.
Build menu **Tools → Mirror repo to forges** opens this menu on both platforms.
Shared implementations are `tools/mirror-menu.mjs`, `tools/mirror-settings.mjs`,
`tools/mirror-active-forges.mjs` and `tools/mirror-archive.mjs`.
Single-repository mode excludes Discussions, projects and wiki. Organization mode
includes enabled wiki and Projects V2 data; Discussions remain excluded.

Run these commands yourself from the checkout:

```sh
# Open the menu:
bash releases/mirror.sh
# Read-only online check:
bash releases/mirror.sh --check-online
# Read-only missing-data and Git ancestry check:
bash releases/mirror.sh --check-missing
# Unattended sync using saved settings:
bash releases/mirror.sh --sync
# Organization inventory without remote writes:
bash releases/mirror.sh --preview-organization
# Sync the selected organization using its saved destination namespaces:
bash releases/mirror.sh --sync-organization
# One active destination, using the selected source:
bash releases/mirror-codeberg.sh
```

On Windows, use `releases\mirror.bat` for the menu, or the same operation flags.
`--preview` is an alias of `--check-missing`. Checks never write to a remote: Git
uses public HTTPS, source/API inventory uses the existing CLI login. API
authentication/rate-limit errors are reported separately from Git access errors.
Missing Git branches and differing tags are listed; commit ancestry compares
source branches with destination branches, preserving extra destination merges.
Temporary read-only Git repositories are removed after comparison.
`node tools/mirror-active-forges.mjs` is a read-only data preview; `--apply`
copies missing data and `--code` includes branches/tags. `--target` selects one
active mirror. Git updates do not force changes or delete destination refs.
When destination `main` has merge commits from older mirror runs, the tool
merges the source default branch in a repository-scoped `git/wekan-<mirror>`
checkout and pushes the
combined history. It inherits the root checkout's Git author identity, preserves
local changes, and aborts conflicting merges. Other divergent branches/tags
are reported for manual resolution.
Run the forge CLI installer in the build menu first on a new machine.

The GitHub menu and organization launcher save each API item directly beneath
`.tools/mirror/github.com/<organization>/<repo>/`. Issues use `issues/<number>/`,
pull requests use `pulls/<number>/`, and releases use `releases/<tag>/`.
`source-item.json` preserves each item; comment and review directories preserve
individual responses and attachments. Issue HTML is available during collection.

`source-manifest.json` stores file references and pagination checkpoints. Collection
holds one API page or conversation at a time rather than the entire repository.
Ctrl+C preserves completed pages, items and downloaded files. Restarting resumes
the interrupted page; that page may be fetched again to finish it safely. Completed
pages are reused. `sync-progress.json` also records finished destination stages,
so an interrupted synchronization skips destinations already completed. A fully
completed synchronization starts a fresh inventory on the next run.

Incomplete inventories never retire items that have not yet been fetched. Changed
content retains its previous version under `old-YYYY-MM-DD_HH-MM-SS-...`.
Checkpoint bookkeeping is replaced atomically. Failed attachment downloads remain
retryable from the saved source data. GitHub previews save raw metadata checkpoints
but do not download attachment archives or write to destinations. Individual scripts
without incremental export still collect their own source snapshot. The data includes
open/closed issues and PRs, comments, reviews, labels, milestones, releases and
fully paginated release assets.

| Data | GitHub | GitLab | Codeberg | SourceForge |
| --- | --- | --- | --- | --- |
| Code, branches, tags, workflow source files | Git | Git | Git | Git |
| Issues and closed state | Native issues | Native issues | Native issues | Tracker tickets |
| PRs | Linked issues | Linked issues with branch/patch information | Same | Same |
| Issue comments, review summaries and inline comments | Native comments | Native comments | Native comments | Tracker discussion posts |
| Labels and milestones | Native entries | Create missing native entries | Create missing native entries | Labels; milestone link in ticket text |
| Published release notes | Native releases | Native releases | Native releases | `README.md` in file release directory |
| Release binaries | Native release assets | Project uploads linked to release | Native release attachments | SFTP file releases |

Authenticate `gh`, `glab` and `tea` separately. For Codeberg binary uploads,
set `CODEBERG_TOKEN` or `GITEA_TOKEN` with repository write permission; metadata
uses the Tea login. `WEKAN_CODEBERG_LOGIN` optionally selects its login name.
GitLab uploads use `GITLAB_TOKEN`, `GLAB_TOKEN`, `OAUTH_TOKEN` or the existing
GitLab login through `glab api --form`. Use current versions of the forge CLIs.
GitHub asset downloads try the public release file URL, falling back to the
optionally authenticated API for private binaries, and verify file
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
planned tool. Existing tools are preserved. Organization wiki Git tools and project export
branches are described below.
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

Issues and comments use their original forge URL marker, never a title, as their identity.
The previous tool's `Mirrored from …` footer is recognized. Existing releases
match by Git tag; their text is preserved. Removing a mirror's provenance can
prevent issue matching, so retain its marker/footer. Existing human text and
source-open destination issue states are preserved. Source-closed mirrored
issues are closed, including after an interrupted first import. New comments
and assets are checked even when the parent already exists. Previously failed
copies are attempted again on the next run. An inventory failure stops writes
to that category rather than assuming it was empty. Other categories and mirrors
continue, and any failures/conflicts produce a nonzero exit status.

Console status, `status.txt`, `report.json` and `source.json` snapshot are saved in
`.tools/log/mirror-data/YYYY-MM-DD_HH-MM-SS/`. Reports list copied/planned/checked items,
archive renames and each failure reason. Transfer files stay in `.tools/tmp`;
completed source files remain in the persistent archive below. Available archived
release binaries are reused for destination uploads. SourceForge also receives
the archived source ZIP/tarball files. Archive failures are reported and later
mirrors still attempt supported data; the overall launcher returns failure.

## Selecting a different source

GitLab reads issues, merge requests and their notes, milestones, labels and
release links; Codeberg reads issues, pull requests, review comments, labels,
milestones and release attachments. Native raw metadata is retained alongside
normalized fields. Native relative attachment links resolve to the original
forge in destination Markdown and local file discovery, including GitLab project
upload paths. Existing mirror markers retain original identities when data
passes through another forge. Native destination URLs also match these identities,
preventing a copy from being imported back as a new issue in its original forge.
GitHub can receive linked issues, comments, labels, milestones and native releases;
binary uploads use authenticated `gh api --input`.

SourceForge reads full Tracker tickets/comments and recursively inventories FRS
files through read-only SFTP. A directory with `mirror.json` restores the original
release tag, asset names and provenance. Other leaf directories become synthetic
`sourceforge-<directory>-<hash>` releases because FRS has no native release objects.
This preserves all files; it does not invent historical release dates or original
tags. Synthetic GitHub releases do not replace the latest release designation.
SourceForge source selection therefore requires read access to FRS over SSH.
Native SourceForge pull requests, reviews and milestones are unavailable; linked
PR tickets retain their original PR identity where their marker supplies one.

Archives are isolated by source host, organization and repository. For example,
`.tools/mirror/github.com/wekan/wekan/` and
`.tools/mirror/gitlab.com/wekan/wekan/` cannot overwrite one another. GitLab
subgroup namespaces retain their path segments. Switching source preserves every
previous source archive. The previous flat WeKan GitHub archive is migrated on an
apply run: existing files are moved into the new namespace; collisions retain the
new file and move the previous file under an `old-...` name. Manual files and
historical versions are kept. Preview does not migrate archives or download attachment files; GitHub incremental
collection does preserve raw metadata and checkpoint files.

## Organizations and destination namespaces

Option 8 manages `.tools/mirror/organizations.json`; defaults select `wekan`.
Adding or editing asks for a GitHub source organization and a destination GitLab
namespace, Codeberg organization and SourceForge project. Blank destination
answers keep the suggested value. GitLab supports subgroup paths. Selecting an
organization changes option 7 and the organization command flags. Removing an
organization removes its configuration only; its archived files remain.

```json
{
  "version": 1,
  "selected": "wekan",
  "organizations": [
    {
      "source": "wekan",
      "destinations": {
        "gitlab": "wekan",
        "codeberg": "wekan",
        "sourceforge": "wekan"
      }
    }
  ]
}
```

Organization mode explicitly reads GitHub, even if the single-repository source
setting is another forge. It uses enabled destinations from `settings.txt`,
excluding GitHub. It discovers all accessible organization repositories on every
run, including forks and archived repositories. Complete discovery happens before
remote writes. Missing GitLab/Codeberg repositories are created without an initial
README; SourceForge repositories use distinct Git tool mounts in the configured
project. Groups/organizations/SourceForge projects must already exist and the
maintainer needs permission to create repositories or tools. Authentication errors
are not interpreted as missing repositories. Private sources require private
mirrors; a public existing mirror or SourceForge public project is reported as
unsupported rather than receiving private data.

Each repository exports its issues, comments, labels, milestones, PR patches,
reviews, releases and binaries through the existing engine. The source repository's
actual default branch is used for merge recovery. Repositories with issues disabled
still export PRs and their issue-style conversations. Errors in one repository or
data category do not stop the remaining repositories. Reports and terminal output
are saved under `.tools/log/mirror-organization/YYYY-MM-DD_HH-MM-SS/`.

Enabled wiki repositories are retained locally as `wiki.git` with files and Git
history. GitLab/Codeberg use their native wiki Git repositories; empty native wikis
are initialized through their API. Conflicting history is merged without forcing
updates; conflicting edits are reported and the merge is aborted. SourceForge uses
a dedicated wiki Git tool, preserving Markdown and history rather than pretending
GitHub Markdown is a native Allura wiki. Disabled wikis have no wiki Git/API requests.
Enabled but inaccessible/uninitialized Git repositories are reported and retried.

Enabled Projects V2 export paginates projects, items, field values and nested
labels/assignees/reviewers/PR links. JSON preserves project text, dates, draft items,
field definitions/options/iterations, multi-select and issue fields, views and
workflow/status metadata. GitLab, Codeberg and SourceForge receive portable project
JSON on a separate `wekan-mirror-projects` branch. Native automation, permissions,
accounts and interactive boards are not recreated. Project visibility is preserved:
private projects linked to public repositories remain local and are reported,
rather than published on a public branch. API/scope/redaction errors preserve the
previous complete archive and retry later. Disabled projects are never queried.
The retired Projects Classic API is not used.

## Persistent files, additions and history

Files live under the source issue number or release version, independently of
the destination forge:

```text
.tools/mirror/github.com/wekan/wekan/
  index.html               # repository page
  index.csv                # repository item inventory
  issues/index.html        # issue listing
  issues/index.csv
  issues/1234/
    issue.json
    README.md
    comments.json
    index.html             # issue plus all comments
    index.csv              # comments and attachment identities
    2000/                  # original comment ID
      comment.json
      index.html           # empty: suppress directory listing
      index.csv            # attachment inventory
      attachment-<url-hash>-ORIGINALFILENAME
    body/                  # links in the issue description
      index.html           # empty
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
readable in `README.md`. All absolute HTTP/HTTPS links in issue bodies,
comments and reviews are archived in the corresponding comment directory, including
images, videos, other files and webpage HTML snapshots. PR patch files and release source
archives are downloaded as well as uploaded release binaries. No files are
unpacked or executed. Original links remain in source JSON/Markdown; webpage HTML is an attachment,
not recursively crawled. Requests carry no forge credentials/cookies to prose links.
Public DNS addresses are checked and pinned for each request and redirect; local,
private and credential-bearing URLs are rejected and reported. Content-Disposition
and Content-Type select safe filenames, including `.html` for webpages.

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
Issue comments and pull request reviews are separate supported data. Enabled
projects and wiki are included only in organization mode.

Menu, settings, source-switch identity, native API shapes, read-only checks, Git
ancestry, Windows dispatch, archive retention and interrupted retries are tested
with offline fixtures. Live remote synchronization is a maintainer-run operation.
API references: [GitHub CLI API](https://cli.github.com/manual/gh_api),
[GitLab releases](https://docs.gitlab.com/api/releases/),
[Gitea API](https://docs.gitea.com/api/1.24/).

## Offline HTML and CSV

Open `.tools/mirror/index.html` for the archive catalogue, then choose host,
organization and repository. Each host and organization also has `index.html`
and `index.csv`. A repository page is at
`.tools/mirror/github.com/wekan/wekan/index.html`; its issue listing is at
`issues/index.html`, and `issues/1000/index.html` displays the issue and comments.
The corresponding CSV files list item identities, text, source URLs, relative
paths and attachment hashes/sizes. Images and videos use local files; the pages
need no CDN, JavaScript or Internet connection. When existing `markdown-it`
dependencies are installed, prose renders as Markdown with raw HTML disabled;
otherwise it remains readable escaped text. Linked images always use archived files.
All comment attachment directories have an empty `index.html`; their contents are
linked by the parent issue page rather than listed as a directory.

Regenerate repository HTML from updated CSV without accessing any forge:

```sh
node tools/mirror-static-rebuild.mjs .tools/mirror/github.com/wekan/wekan
```

GitLab uploads files as project Markdown uploads and references them in the same
mirrored comment; Codeberg attaches to the actual comment ID. SourceForge attaches
to the discussion post. Description links use native issue/project uploads where
supported. SourceForge description files remain archived locally. GitHub's public
REST API does not support issue/comment file uploads; these are reported instead
of inventing an endpoint. Unsupported API/size/authentication failures preserve
local files and are retried. Existing comment prose is preserved; only missing
attachment references are appended. Content hashes prevent duplicate uploads on a
successful rerun and allow changed versions to be attached alongside older ones.

Organization and linked-file regressions use offline Git/API/download fixtures;
menu tests exercise actual prompts. No live remote writes are performed by tests.
Additional references: [GitHub organization repository inventory](https://docs.github.com/en/rest/repos/repos#list-organization-repositories),
[GitHub Projects GraphQL schema](https://docs.github.com/en/graphql/reference/projects),
[GitLab wiki API](https://docs.gitlab.com/api/wikis/),
[GitLab Markdown uploads](https://docs.gitlab.com/api/project_markdown_uploads/),
[Gitea comment attachment API](https://docs.gitea.com/api/1.24/operations/issue-create-issue-comment-attachment/).

## Rate limits and tokenless GitHub reads

Every HTTP/API request is serialized per host and paced. GitHub reads use
`GH_TOKEN`, `GITHUB_TOKEN` or an existing `gh` login if available. With none,
public REST reads use direct HTTPS without requiring `gh`; an invalid token
falls back to public reads. Private data and remote writes still require suitable
authentication. GitHub's unauthenticated REST allowance is lower, so a large
organization can take considerably longer to export without a token.

The transports honor `Retry-After`, `X-RateLimit-Remaining`/`X-RateLimit-Reset` and
`RateLimit-Remaining`/`RateLimit-Reset`, including GitHub primary/secondary limits.
Repeated throttling waits progressively longer and stops after six attempts,
retaining its cooldown for the next run. Waiting occurs in intervals of at most
60 seconds and is logged. A timeout starts after the wait, rather than expiring
while the request is queued. GitLab and Tea API commands include response headers;
file uploads/downloads and SourceForge HTTP requests use the same limit handling.
Git/SSH/SFTP commands respect saved cooldowns and retain a cooldown when their
errors report throttling. Their protocols do not provide REST quota headers.

Cooldowns persist in `.tools/mirror/rate-limits.json` and
`.tools/mirror/github-rate-limit.json`. These contain host/resource timestamps,
never tokens. GitHub GraphQL Projects requires authentication: without it,
organization mode retains a public projects landing-page HTML attachment instead
of claiming a complete structured project export. Public REST issue/comment data
still produces the complete offline issue pages. A failed public page download is
reported and retried; prior structured project archives are preserved.

See [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
and [GitHub API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).

Verification on 2026-09-13: all 1,014 Node suites pass; final targeted archive,
organization, API and rate-limit checks pass. The static navigation/attachment
browser regression passes in Chromium and Firefox. WebKit is registered and
syntax-checked but cannot launch locally because ICU 74 is missing; Docker is
unavailable for the documented container fallback. Live uploads and native remote
wiki initialization still require maintainer-run verification.

Sync progress is printed immediately before source inventory, local archive and
each destination stage. Child-process stdout and stderr are streamed directly to
the terminal; a 15-second elapsed-time message remains visible during long stages.
GitHub API requests identify the endpoint, page and retry attempt before fetching,
without printing authentication headers or tokens. Rate-limit waits remain in effect.

The `releases/mirror.sh` launcher also saves stdout and stderr to
`.tools/log/mirror/YYYY-MM-DD_HH-MM-SS/mirror-log.txt` while printing them
to stdout. It prints the log path at startup, after each sync/check menu operation (including
failures), and on command exit, preserving command failure status.

If a comment references a parent missing from the paginated issue inventory, the
collector fetches that issue and any pull metadata through the same rate-limited
API client, saves them directly to their issue/pull directory and continues. A
failed parent fetch preserves the checkpoint so a subsequent run retries the page.

### Staged synchronization and concurrent destinations

Menu option 1 first synchronizes the selected source Git branches and tags
with every active destination. Only after Git succeeds does it collect source
issues, pull conversations, releases and linked files into the durable
`.tools/mirror/<host>/<organization>/<repo>/` archive and generate static pages.
An archive failure stops destination content writes.

After the local archive is ready, separate destination processes synchronize
its content concurrently. They reuse the same snapshot, preserve completed
resume checkpoints, and retain each forge's rate-limit handling. Live progress
shows every active mirror together: start time, processed issues/total,
processed releases/total and running/finished/failed state. Processed counters
include checked existing items, failed items and unsupported/draft releases;
they measure work examined, while copied/failed logs describe the result.

Each run retains the combined mirror-log.txt plus github.txt, gitlab.txt,
codeberg.txt or sourceforge.txt beside it, according to active destinations,
in `.tools/log/mirror/YYYY-MM-DD_HH-MM-SS/`. These separate logs include Git
and destination content output. Starting this script performs remote writes
and is a human maintainer operation; offline tests use injected local commands.

### Unavailable linked files and historical recovery

Unavailable public issue/comment links are checked against archive.org's
Wayback availability API using the content creation timestamp. The closest
available successful capture is downloaded into the same comment directory,
with recoveredFrom and captureTimestamp provenance in mirror-index.json.
Original URLs remain the synchronization identity. Current links bypass this
fallback; archive.org failures do not cause recursive recovery attempts.

Attachment requests have a 30-second deadline covering redirects and body
transfer. Long saved cooldowns and new rate limits defer the attachment to a
later run instead of waiting; the saved cooldown remains respected. Optional
linked-file failures are logged as skipped and preserve existing local bytes,
so remaining content and target synchronization can continue. Repository/API
inventory failures still stop incomplete synchronization. Private/local links
remain blocked and no forge credentials are sent to archive.org or linked sites.
