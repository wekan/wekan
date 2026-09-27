# Editor Enter behavior

Member Settings / Change Settings / Submit editors with Enter controls multiline
editors. Enabled: Enter saves, Shift+Enter inserts a newline. Disabled: Enter and
Shift+Enter insert a newline; Ctrl/Cmd+Enter saves. The current user preference
is read on each keypress, so switching it does not require a reload.

The audit covers all `textarea` and shared `+editor` declarations in `client`,
and the Enter handlers in components and client libraries. These fields use the
shared `isSubmitKey` rule. Template-specific handlers consume their save key
once; the delegated `editorSubmit` handler covers otherwise unhandled forms.
It activates the editor's existing submit button, preserving validation and
server permissions. Autocomplete-consumed events and IME composition do not
submit. Disabled/read-only fields and unavailable save controls do not submit.

| Editors | Submission owner |
| --- | --- |
| Add board, board description | Native form fallback |
| Add swimlane, inline/popup add list | Native form fallback |
| Rename list/swimlane, checklist titles/items, custom text fields | Shared inline form |
| Add card, optional new-card description | Card composer and native form fallback |
| Calendar range-selection card title | Multiline field with explicit Create action in its modal |
| Card title | Scoped title handler |
| Card description | Enclosing inline description; removed the conflicting child handler |
| Comments and replies, comment editing | Comment handler or shared inline form |
| Checklist items on opened cards and minicards | Shared inline form/item handler |
| Subtask creation and title editing | Shared inline form/subtask handler |
| Card text notes, bulk checklist text | Native form fallback |
| Move/copy card titles, move reason, bulk-copy and checklist-to-card titles | Explicit destination Done button |
| Requester/assigner free-text editors | Textareas in the shared inline form |
| Board/dependency import text, authentication configuration | Native form fallback |
| Invitation recipients, mail template bodies | Explicit Invite/Save action in the same settings pane |
| Support, announcement, accessibility, logo text, URL schemes, PWA metadata | Explicit Save action in the same settings pane |
| GCS credentials | Explicit cloud settings Save action, not Test connection |
| Rule email body | Explicit action button in the same rule row |

Search/filter boxes, passwords, numeric/date/color controls, URLs and structured
single-line tokens retain their own keyboard behavior: these are not multiline
editors. Read-only JSON/error output stays read-only. The Rules import textarea
has separate JSON, CSV and workflow actions with no unique default: it keeps
newlines and requires choosing the intended import action. Generic submission
never guesses between those actions or searches another editor for Save.

Creation's existing single-object/multiple-object choice remains authoritative:
inserting a newline edits the draft; submitting then interprets it using that
choice. Checklist items retain their existing one-item-per-line insertion.

## Multiline and manual resizing

Ordinary text fields use `textarea`: board/workspace/list/swimlane/card titles,
copy/move titles, labels, custom field names, notes, voting questions, location
names/addresses, webhook titles, WIP group names, profile full names, organization
and team display names/descriptions, product/support/announcement text, translated
values, rule names/button labels and rule arguments referring to multiline names.
Their existing identifiers and Save actions remain unchanged.

All textareas expose the native resize handle (bottom-right in LTR, bottom-left
in RTL). Width stays within the container; height can grow. Taking the resize
handle releases autosize for that editor so typing does not shrink the user's
chosen size. Until then, existing automatic growth remains available. New short
textareas start with two rows rather than the large description-editor height.

The retained single-line fields are passwords/login names, initial letters,
search/filter expressions, URLs/email headers, API/identity/configuration tokens,
file names, date/time/numeric/color controls, locale and translation keys,
organization/team short identifiers, and the custom-field dropdown/string-template
token controls with their existing add-token keyboard behavior.

Executable coverage is in `tests/editorSubmitKey.test.cjs`,
`tests/editorSubmitRouting.test.cjs`, and the Playwright specs
`editor-enter-preference.e2e.js` and `editor-multiline-resize.e2e.js`.
The existing checklist single-submit, rule workflow, multiline-title and mention
suites cover their interaction with the shared handler. Browser verification uses
Chromium against the source Meteor application; other engines are not covered by
this run.
