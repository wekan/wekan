# Transifex translation audit

Audit date: 2026-09-12. Compared the uncommitted pull with commit
`b3e7a9d4c0c0de43e2a522862c51f82bb355aa28`. Counts describe that snapshot.

Compared working files with HEAD. Translation files were not modified or committed.

20 locale files contain 4,061 changed values. All 20 files parse as JSON. Changed values preserve the checked source underscore and percent placeholders. No changed value equals the exact English source; this does not certify language or meaning.

## Findings and items requiring review

| Target locale | Changed values | Findings from inspected values |
| --- | ---: | --- |
| ace | 7 | Indonesian/Malay replacements for Acehnese strings |
| ar-DZ | 4 | Persian replacements for Arabic strings |
| ar-EG | 4 | Persian replacements for Arabic strings |
| ar | 4 | Persian replacements for Arabic strings |
| ary | 11 | Persian replacements and loss of Moroccan Arabic wording |
| ast-ES | 4 | Spanish replacements for Asturian wording |
| br | 1 | French replacement for Breton no-assignee |
| ca@valencia | 144 | Spanish replacements for Valencian/Catalan wording; bucket-example has unrelated previous-month text |
| da | 615 | Swedish replacements for Danish, with some Norwegian vocabulary |
| eo | 1,397 | Spanish and French replacements for Esperanto |
| eu | 419 | Spanish replacements for Basque |
| gl | 1,384 | Portuguese replacements for Galician |
| sv | 10 | roles-info contains Claude responded: and repeated prose; Type becomes Skriv; Cards becomes Tavlor |
| ta | 1 | Who becomes uppercase English WHO |
| te-IN | 1 | Who becomes uppercase English WHO |
| th | 51 | Vietnamese replacements for Thai |
| tk_TM | 1 | Cancel changes from Ýatyr to Elatyr; needs Turkmen review |
| ug | 1 | copyManyCardsPopup-format is truncated to [. |
| uz-AR | 1 | Arabic-script Uzbek cancellation becomes Latin-script Uzbek |
| ve-PP | 1 | Veps cancellation becomes Peruuta, a Finnish word; requires Veps vocabulary review |

These are changed-value totals, not counts certified wrong by exhaustive linguistic review. Similar technical labels or borrowed words can be valid across languages. The large wrong-language examples are sufficient to reject committing this batch as correct.

## Recommendation

Review per key. Restore confirmed wrong-language, broken-example and contaminated values from the previous committed target-language text, and keep only verified correct-language improvements. Do not blindly accept every non-English value or discard a complete locale without review. Local files do not establish whether a value was entered by a human, imported, or machine generated on Transifex.

The detailed before/after inventory from this audit is retained locally in
`.tools/tmp/transifex-uncommitted-audit.json`; it is not included in this
documentation commit.
