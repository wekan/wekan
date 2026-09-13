# Mirroring GitHub to active WeKan mirrors

`releases/mirror.sh` runs `mirror-gitlab.sh`, `mirror-codeberg.sh` and
`mirror-sourceforge.sh`. Only uncommented `mirror "name" "URL"` calls select
active targets; Bitbucket remains disabled. `releases/mirror.bat` and the
corresponding per-mirror `.bat` scripts run the same Node engine on Windows.
Build menu **Tools → Mirror repo to forges** calls this flow on both platforms.
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
Run the forge CLI installer in the build menu first on a new machine.

The all-mirror launcher reads one fresh, fully paginated GitHub snapshot for
the run. Individual scripts read a fresh snapshot when run separately. The
snapshot includes open/closed issues and PRs, issue discussion comments, inline
review comments, labels, milestones, releases and their fully paginated assets.

| Data | GitLab | Codeberg | SourceForge |
| --- | --- | --- | --- |
| Code, branches, tags, workflow source files | Git | Git | Git |
| Issues and closed state | Native issues | Native issues | Tracker tickets |
| PRs | Linked issues with branch/patch information | Same | Same |
| Discussion and inline review comments | Native comments | Native comments | Tracker discussion posts |
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
`.tools/log/mirror-<timestamp>/`. Reports list copied/planned/checked items and
each failure reason. Download caches and temporary files stay in `.tools/tmp`.
Cached release binaries can be large; remove `.tools/tmp/mirror-active` after a
successful run if the cache is no longer needed.

The tool reports its practical scope. Original authors and timestamps appear
in provenance, rather than creating accounts or impersonating authors. It does
not copy reactions, votes, approval review summaries, issue attachment binaries,
inline image binaries, Actions execution logs, secrets or executable CI
conversion. Issue attachment/image URLs remain in the copied Markdown. Draft
releases stay at GitHub and are not published at destinations. This is additive
synchronization, not an exact backup of every GitHub feature.

Offline fixtures verify pagination, URL-based matching, restart behavior,
comment/asset retries, target inventory failures and platform launchers. No live
remote writes are part of those tests. Live permissions, limits and forge
configuration still need verification in a maintainer-run preview/apply run.

API references: [GitLab releases](https://docs.gitlab.com/api/releases/),
[Gitea API](https://docs.gitea.com/api/1.24/),
[Allura tracker API](https://forge-allura.apache.org/rest-api-docs/),
[SourceForge file transfers](https://sourceforge.net/p/forge/documentation/Release%20Files%20for%20Download/).
