Right to click your username / All Boards / Add Board / Import / From CSV/TSV

[Original Import CSV issue](https://github.com/wekan/wekan/issues/395)

[CSV import was added at PR 3081](https://github.com/wekan/wekan/pull/3081)

Here's a copy of the CSV and TSV to test out the functionality:
- [board-import.csv](board-import.csv)
- [board-import.tsv](board-import.tsv)

Frontend:
- [Import CSV code](../../../client/components/import)

Backend:
- [Import CSV code](../../../models/csvCreator.js) and [General Import code](../../../models/import.js)

Related:
- [Related PRs](https://github.com/wekan/wekan/pulls?q=is%3Apr+is%3Aclosed+csv)
