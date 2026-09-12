# Force-pushing all local translations to Transifex

Run the explicit upload operation from any directory:

```sh
releases/translations/push-all-translations.sh
```

It uploads the English source and every other local language file, including
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

Missing project targets are added using the additive language-relationship API;
existing project languages are retained. The supported Transifex API cannot create
an arbitrary new language in its global language catalogue. Unknown codes are
still attempted as project additions, then reported if Transifex rejects them.
Correct their mapping or request catalogue support from Transifex and rerun.

The upload implementation follows the [Transifex API v3 documentation](https://transifex.github.io/openapi/).
It bypasses the CLI's timestamp skip rather than using an undocumented force
attribute. The [CLI documentation](https://developers.transifex.com/docs/cli)
describes `--force` as disabling that timestamp skip.
