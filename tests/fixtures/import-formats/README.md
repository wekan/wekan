# Import format audit fixtures

Synthetic data only. Documentation checked on 2026-09-23. These are minimal
samples of the supported input shapes, not a claim that every native export
or all fields from these products are supported. No vendor account was used.

| Fixture | Format and authoritative documentation | Limits |
| --- | --- | --- |
| `trello.json` | [Board JSON](https://developer.atlassian.com/cloud/trello/rest/api-group-boards/) | Includes comments, checklist, attachment metadata; the UI test packs `audit.txt` into a ZIP. |
| `jira.json` | [Cloud REST v3 enhanced search](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/) | ADF description; comments and attachment metadata do not currently import. |
| `kanboard.json` | [JSON-RPC API](https://docs.kanboard.org/v1/api/) | Assembled board/columns/swimlanes/tasks, not a native single-file export. |
| `deck.json` | [Deck API](https://github.com/nextcloud/deck/blob/main/docs/API.md) | Assembled board/stacks/cards; attachments are separate Nextcloud resources. |
| `openproject.json` | [API v3](https://www.openproject.org/docs/api/) | HAL work-package collection; attachment metadata is not file content. |
| `github.json` | [REST issues](https://docs.github.com/en/rest/issues/issues) | Current supported API version 2026-03-10; comments require separate requests. |
| `gitlab.json` | [API v4 issues](https://docs.gitlab.com/api/issues/) | Issue array, not project-export archive; notes/files are separate. |
| `gitea.json` | [API usage](https://docs.gitea.com/development/api-usage/) | Issue array; actual schema/version depends on the source server. |
| `forgejo.json` | [API usage](https://forgejo.org/docs/latest/user/api/usage/) | Issue array; actual schema/version depends on the source server. |
| `asana.json` | [API v1 tasks](https://developers.asana.com/reference/gettasks) | Tasks response; newest bulk JSONL.gz resource export is not supported. |
| `zenkit-adapter.json` | [JSON export documentation](https://help.zenkit.com/en/support/solutions/articles/43000642205-exporting-a-list-as-json-file) | Adapter-shaped sample only: vendor docs do not publish a concrete JSON schema. Native current export compatibility remains unverified. |
| `csv.csv` | CSV with quoted multiline Unicode text | No standard file-attachment representation. |
| `markdown.md` | Markdown task-list convention | No universal kanban Markdown interchange schema. |

`audit.txt` deliberately includes a NUL byte and a non-UTF-8 byte. Tests compare
raw bytes, not a decoded string, to detect accidental file corruption.
`expectations.json` contains the expected Unicode title, multiline description
and comment. Excel tests create an OOXML workbook using the installed ExcelJS.

The browser suite checks real imports, malformed documents, rendered cards,
export links and unauthorized export requests. Its Trello ZIP → WeKan JSON →
WeKan import test checks comments, checklist items and exact attachment bytes.
Passing text-import checks for other adapters does **not** establish file or
comment preservation: those adapters currently omit additional content.

See [format coverage](../../../docs/Features/ImportExport/Format-Coverage.md)
and [menu audit](../../../docs/Features/Menu-Implementation-Audit.md).
