# Microsoft Planner export fixture

`plannr-test_plan.xlsx` is a workbook in the layout Microsoft Planner's
"Export plan to Excel" writes: plan name, plan ID and export date on rows 1-3,
a blank row, the column header on row 5 and one row per task. It is the test
data of [plannr](https://github.com/program--/plannr)
(`tests/testdata/test_plan.xlsx`), an R package that reads Planner exports,
copied unchanged under its MIT licence (`LICENSE-plannr`). Its people are the
package author's sample names, and its task IDs repeat, which a real export
does not.

Used by `tests/plannerFormat.test.cjs`.
