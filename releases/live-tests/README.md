# Live tests

Tests against the real services, with your own accounts. They are human-run
only, from build.sh / build.bat → Tests → Live tests, or:

```
node releases/live-tests/run.mjs              # every test
node releases/live-tests/run.mjs planka-import # one
```

A test whose login is not set is skipped, not failed. The log goes to
`.tools/log/<datetime>/live-tests.log`. Keep the variables out of the
repository, for example in your shell's profile.

| Test | What it does | Login |
| --- | --- | --- |
| `gitlab-write-back` | List Sync's write-back ([#2698](https://github.com/wekan/wekan/issues/2698)): edits, a comment, close and reopen on one scratch issue in a private `wekan-live-test` project of your account, deleted at the end | the `glab` login `releases/mirror.sh` uses, or `GITLAB_TOKEN`; `WEKAN_LIVE_GITLAB_PROJECT`, `WEKAN_LIVE_GITLAB_URL` optional |
| `planka-import` | lists your boards, fetches the first, parses it - read only | `WEKAN_LIVE_PLANKA_URL`, `WEKAN_LIVE_PLANKA_USERNAME`, `WEKAN_LIVE_PLANKA_PASSWORD` |
| `mstodo-import` | Microsoft To Do: all lists - read only | `WEKAN_LIVE_MSTODO_TOKEN` (Microsoft Graph, Tasks.Read) |
| `kanbanflow-import` | the token's board - read only | `WEKAN_LIVE_KANBANFLOW_TOKEN` |
| `basecamp-import` | lists your projects, fetches the first - read only | `WEKAN_LIVE_BASECAMP_ACCOUNT`, `WEKAN_LIVE_BASECAMP_TOKEN` |
| `googletasks-import` | all task lists - read only | `WEKAN_LIVE_GOOGLE_TASKS_TOKEN` (tasks.readonly) |
| `googlekeep-import` | all notes - read only | `WEKAN_LIVE_GOOGLE_KEEP_TOKEN` (keep.readonly, Google Workspace) |

The import tests only read. The GitLab test writes, to the scratch issue it
creates and removes.
