Right to click your username / All Boards / Add Board / Import / From CSV/TSV

[Original Import CSV issue](https://github.com/wekan/wekan/issues/395)

[CSV import was added at PR 3081](https://github.com/wekan/wekan/pull/3081)

Here's a copy of the CSV and TSV to test out the functionality:
- [board-import.csv](https://wekan.github.io/csv/board-import.csv)
- [board-import.tsv](https://wekan.github.io/csv/board-import.tsv)

Frontend:
- [Import CSV code](https://github.com/wekan/wekan/tree/main/client/components/import)

Backend:
- [Import CSV code](https://github.com/wekan/wekan/blob/main/models/csvCreator.js) and [General Import code](https://github.com/wekan/wekan/blob/main/models/import.js)

Related:
- [Related PRs](https://github.com/wekan/wekan/pulls?q=is%3Apr+is%3Aclosed+csv)
