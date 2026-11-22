# Force-pushing all local translations to Transifex

## What it is

Push all is the maintainer's explicit command that uploads every local
translation, and the English source, to Transifex, replacing the values there
whatever their dates. It is the opposite direction of the normal pull, which
never publishes anything; use it only when the local catalogs are the ones to
keep.

## Read more

- [Transifex](https://en.wikipedia.org/wiki/Transifex) on Wikipedia, the
  [Transifex API v3](https://transifex.github.io/openapi/), its
  [rate limits](https://developers.transifex.com/reference/rate-limit) and
  [partially translated files](https://help.transifex.com/en/articles/6318456-uploading-translations).
- WeKan pages: [Translations](Translations.md), [Translation audit](Audit.md).

## How to use it

1. Put a Transifex token in `TX_TOKEN` or `~/.transifexrc`.
2. Check first, offline and without credentials:
   `releases/translations/push-all-translations.sh --dry-run`.
3. Upload: `releases/translations/push-all-translations.sh`.
4. Read the failure list at the end (`None` when all succeeded), the JSON
   report under `.tools/log/translations-push/<datetime>/report.json` and the
   status log `.tools/log/push-all-translations_<datetime>.txt`.

The details, and the language mappings, follow below.

## How the numbers are calculated

From `retryingRequest()` in
[releases/translations/push-all-translations.mjs](../../../../releases/translations/push-all-translations.mjs):

- A read that fails with HTTP 408, 500, 502, 503 or 504, a network failure or a
  timeout is tried at most 6 times in all; the wait doubles from 2 s
  (`2000 * 2^(attempt-1)` ms, at most 32 s).
- HTTP 429 waits at least 60 s, or longer when `Retry-After` says so, within
  the same 6 attempts.
- A long wait prints progress at least every 30 s.
- The offline dry run reports 241 distinct targets and the English source.

## How it works in WeKan

Files: [releases/translations/push-all-translations.sh](../../../../releases/translations/push-all-translations.sh)
and [push-all-translations.mjs](../../../../releases/translations/push-all-translations.mjs).
Tests: [tests/transifexForcePush.test.cjs](../../../../tests/transifexForcePush.test.cjs),
[tests/transifexUploadRetry.test.cjs](../../../../tests/transifexUploadRetry.test.cjs),
[tests/transifexPartialUpload.test.cjs](../../../../tests/transifexPartialUpload.test.cjs).

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

Transient GET failures (HTTP 408/500/502/503/504, network failures and
timeouts) retry the same read up to six attempts. This includes upload-job
status reads: a temporary 502 does not immediately abandon an accepted source
upload and prevent every target from uploading. HTTP 429 responses retry after
at least one minute, respecting a longer `Retry-After` value in seconds or as an
HTTP date. Other failed writes are not automatically resubmitted, because a
failed response can leave an already-created upload job. Permanent errors and
exhausted retries remain explicit failures.

Output announces each upload, job acceptance and periodic pending status, and
reports each retry with its delay. Long retry waits print progress at intervals
of at most 30 seconds. This output goes to the existing terminal/status log.
Transifex documents throttling as [HTTP 429](https://developers.transifex.com/reference/rate-limit).

At the end it lists each failed language with its local file and reason, saves a
JSON report under `.tools/log/translations-push/YYYY-MM-DD_HH-MM-SS/report.json`, and
returns a nonzero exit status when any language failed. An entirely successful
run prints `None` in the failure list. Invalid JSON, unknown keys, empty catalogs,
empty values where the source is nonempty, and altered placeholders are failures.

Target files may omit source keys that have not been translated yet. The script
reports the missing-key count and uploads only the existing local entries; it
does not add English placeholders or modify locale files. The source upload
retains all English keys. Offline dry runs use the same target validation as real
uploads. This follows Transifex's support for
[partially translated files](https://help.transifex.com/en/articles/6318456-uploading-translations).
Whole-file protection for the PR #6695 human-owned locales remains in place.

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

## Commits

 - [Allow untranslated source keys in target uploads](https://github.com/wekan/wekan/commit/81d4dc420d77a50b1fd897d07bcd70aeb531e757)
 - [Readable datetimes for build and release log directories](https://github.com/wekan/wekan/commit/0d6be31986887e21b126fa0efc1ef7db3afe607e)
 - [Retry transient upload status failures with progress](https://github.com/wekan/wekan/commit/7f24f80355562ff26d7a28e5d5d251b3961e5aab)
 - [Verify retries when Transifex adds missing language support](https://github.com/wekan/wekan/commit/ad294f7073fb67cb147bc834a260d35d33128fda)
 - [Report upload outcomes and Transifex language support](https://github.com/wekan/wekan/commit/637dbebd66d28b498640fb18f12786e59de28186)
 - [Hyphenated Chinese script code for Transifex](https://github.com/wekan/wekan/commit/c2a9168c46c64eb84a58c489f3063b0d03104227)
 - [Save upload terminal status to timestamped logs](https://github.com/wekan/wekan/commit/196c0addcf0d677f343bd4e97e063b85302c334a)
 - [Fix the Russian Russia upload mapping](https://github.com/wekan/wekan/commit/e6aed7a8cd39c08b0817e7a760a8fe9d5a1c7657)
 - [Force upload of all local translations, with missing-language registration and failure reports](https://github.com/wekan/wekan/commit/5290ee727189a94e949a645b1aeb965393400813)
