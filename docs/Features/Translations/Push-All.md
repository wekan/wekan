# Force-pushing all local translations to Transifex

Run the explicit upload operation from any directory:

```sh
releases/translations/push-all-translations.sh
```

It uploads the English source and every distinct remote target language, including
regional English variants. Local translation values replace the corresponding
remote values, irrespective of file or remote modification times. Source strings
edited remotely are also replaced by the local source. This operation publishes
local direct translations as well as human translations. It is separate from the
pull workflow, which never automatically publishes its restored fallback values.

Credentials come from `TX_TOKEN` or `~/.transifexrc`. Node.js is required; set
`NODE_BIN` to the executable path if it is not available as `node`. No `tx` binary
or new npm dependency is required.

Check file validity and all locale mappings without authentication or network
access first:

```sh
releases/translations/push-all-translations.sh --dry-run
```

The script uses `.tx/config` language mappings, so Veps (`ve-PP`) uploads as `vep`,
Venetian (`ve-CC`) as `vec`, and Flemish (`vl-SS`) as `vls`. It requests each missing
project language individually, then uploads its entire local JSON file. A failed
registration or upload does not stop later languages. It polls each asynchronous
upload until Transifex reports success or failure; acceptance of the job alone is
not counted as success. Source upload failure reports all targets as unpushed.

At the end it lists each failed language with its local file and reason, saves a
JSON report under `.tools/log/translations-push-<timestamp>/report.json`, and
returns a nonzero exit status when any language failed. An entirely successful
run prints `None` in the failure list. Invalid JSON, missing keys, empty values
where the source is nonempty, and altered placeholders are reported as failures.

Every invocation also saves terminal status and errors to
`.tools/log/push-all-translations_YYYY-MM-DD_HH-MM-SS.txt`, using local time.
This includes offline dry runs and failed invocations; logging preserves the
command's exit status. The status log path is printed at startup.

Missing project targets are added using the additive language-relationship API;
existing project languages are retained. The supported Transifex API cannot create
an arbitrary new language in its global language catalogue. Unknown codes are
still attempted as project additions, then reported if Transifex rejects them.
Correct their mapping or request catalogue support from Transifex and rerun. Each run
fetches current project languages and attempts every local target again. Previous
failure reports are output only; they are never read as a skip list. Once Transifex
supports a previously missing code, the next run adds it to the project and uploads
its full local translation. Already-added languages are uploaded again without
another registration. If Transifex chooses a different code, update `.tx/config`
to that supported code before rerunning. No background retries occur between runs.

The upload implementation follows the [Transifex API v3 documentation](https://transifex.github.io/openapi/).
It bypasses the CLI's timestamp skip rather than using an undocumented force
attribute. The [CLI documentation](https://developers.transifex.com/docs/cli)
describes `--force` as disabling that timestamp skip.

Colombian Spanish maps `es-CO.i18n.json` to Transifex `es_CO`; `es-CO`
is not a supported Transifex code. The legacy `es_CO.i18n.json` file is an alias
of that remote target. The explicit mapping selects `es-CO.i18n.json`, and the
script reports the alias instead of uploading the same target twice. Both local
files remain available; all nine differences were reviewed, with three erroneous values repaired and
seven valid wording alternatives retained.
The offline dry run reports 241 distinct targets and the English source.

French Belgium/Canada use `fr_BE`/`fr_CA`, Khmer Cambodia uses `km_KH`,
and Guarani uses Transifex's `gug_PY`. The Khmer hyphen/underscore files
share one target. Transifex's public catalogue currently lists no Manx (`gv`)
or Ladin (`lld`); these failures remain visible. Ladin must not be mapped to
Ladino (`lad`), which is a different language. Catalogue reference:
https://explore.transifex.com/languages/

Portuguese Portugal maps `pt-PT.i18n.json` to `pt_PT`; the local underscore
variant shares the remote target and is reported as an alias. Local variants
keep their wording; only the explicitly mapped canonical file round-trips
through Transifex. The canonical file remains registered and loaded.

Russian Russia maps `ru-RU` to `ru_RU`; its symlink/underscore filenames
share one remote target and are reported rather than uploaded twice.

Aromanian (`rup`) is absent from the current public Transifex catalogue and
remains a reported registration failure. It must not be mapped to Romanian
(`ro`), because those are different languages.

Tigre (`tig`) is also absent from the public catalogue and remains a reported
registration failure. Tigrinya (`ti`) is a different language and cannot replace it.

Simplified Chinese script locale `zh-Hans` uses the same hyphenated Transifex
code; `zh_Hans` is unsupported. Wolaytta (`wal`) is absent from the public
catalogue and remains a reported registration failure.

The final status lists successful source/target uploads and every failed upload
with its reason. It then reads the complete paginated global language catalogue
to distinguish supported failed targets from unsupported local codes, and lists
additional supported targets that have no mapped local translation yet. Those
additional targets require local translation files, registry entries and explicit
mappings before they can be uploaded. Discovery never adds these targets itself.
If catalogue discovery fails, support remains unknown; a network or permission
failure is never reported as proof that a language is unsupported. These details
are saved in both the text log and `report.json`.

There is no documented `tx` CLI command to create a global catalogue language.
Supported languages can be added to a project, which this script already tries.
For an unsupported language, [request support from Transifex](https://help.transifex.com/en/articles/6208588-how-do-i-add-a-new-language)
with its name, ISO/BCP47 code, aliases and authoritative Unicode plural rules.
The maintainer submits that request; the script prints the instructions.
