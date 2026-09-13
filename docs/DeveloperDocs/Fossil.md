# Local Fossil copy of Git history

Install Git and Fossil, then run from any directory:

```sh
bash /path/to/wekan/releases/fossil.sh
bash /path/to/wekan/releases/fossil-ui.sh
```

The default destination is `../fo/wekan.fossil` beside the WeKan checkout.
To choose another filename, pass it as one argument; relative filenames are
resolved from your current directory:

```sh
bash releases/fossil.sh "../fo/wekan-new.fossil"
bash releases/fossil-ui.sh "../fo/wekan-new.fossil"
```

Both actions are also in `build.sh` and `build.bat` under Releases → Git and repo,
and available as `fossil-export` and `fossil-ui` command-line actions. Windows
uses Git Bash and an installed Fossil executable.

The export selects Git branches, tags and remote branches. Internal checkpoint
refs can point to trees instead of commits; selecting every ref with `--all`
causes the reported `unexpected object of type tree` warnings. The script
selects the history namespaces explicitly, preserving diagnostic output and
leaving Git refs intact. See [Git fast-export](https://git-scm.com/docs/git-fast-export).

Run the export again with the same filename to add new Git commits. Existing
repositories use Fossil's `--incremental` import; repeated runs do not duplicate
commits. The script re-exports the selected Git history, so updating a large
repository may take time. It never forces an overwrite. If an interrupted import
left an invalid repository, Fossil reports the error; choose a new filename.
Git and Fossil
failures return a failing status. See [Fossil import](https://fossil-scm.org/home/help/import).

The copy and its UI work on-premise without Internet access or a remote mirror.
