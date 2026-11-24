# Custom field: Admin only and display order

## What it is

Two per-field settings for managing a board's [Custom Fields](README.md)
as they grow in number: an **Admin only** flag that hides a field's value
from everyone but board admins, and a drag-to-reorder **display order** that
controls the order fields are listed and shown on a card. Beside them is a
third flag, **Read-only**, for a value every member sees but only board admins
change.

## Read more

- [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
  on Wikipedia - what a field restricted to the board admin role is.
- In WeKan: [Custom Fields](README.md), [Card Settings](../Card-Settings.md)
  (where the fields are ordered) and [Linked custom fields](Linked-Custom-Fields.md)
  (which never carry an Admin only field).

## How to use it

### Where to find it

**Board Settings → Card → Custom Fields** (the field's hamburger opens its
edit form; drag the fields there to reorder them), and the opened **card's
Custom Fields heading's hamburger → Edit custom fields** (the pencil beside a
field opens the same edit form).

```
┌ Card ───────────────────────────────┐
│ Custom Fields          [ ☰ ]  <- menu│
│  Release: v2.0                       │
│  Budget: 500                         │
└────────────────────────────────────────┘

┌ Edit Field ─────────────────────────┐
│ Name: [ Budget............ ]         │
│ Type: [ Number ▾ ]                   │
│ ☐ Show this field on card            │
│ ☐ Add field to new cards             │
│ ☐ Add field to all cards             │
│ ☐ Show field label on minicard       │
│ ☑ Visible only to board admins       │
│        <- only board admins see this │
│ ☐ Read-only: every member sees the   │
│   value, only board admins change it │
│ [Save]                [Delete]        │
└────────────────────────────────────────┘

┌ Card Settings: Custom Fields ───────┐
│ ☐ ✥ Release        ☰  <- drag here   │
│ ☐ ✥ Budget         ☰  <- edit form   │
│ +  <- Create Field                   │
└────────────────────────────────────────┘
```

### Steps to use it

1. **Admin only** (#3141): open a card, click the Custom Fields heading's
   hamburger menu, click the pencil of a field to edit it (or **Create
   Field** for a new one), scroll to the checkboxes and check **Visible only
   to board admins**. The same form opens from the field's hamburger in
   Board Settings → Card → Custom Fields. This checkbox is only shown
   to a board admin - a regular board member never sees or can toggle it.
   Once set, a non-admin board member no longer sees that field's value on
   the card or minicard. Click **Save**.
2. **Read-only** (#3143): in the same form, check **Read-only: every member
   sees the value, only board admins change it**. Also shown only to a board
   admin.
3. **Display order** (#4165): open **Board Settings → Card**, go to the
   **Custom Fields** section, and drag a field up or down - by its drag
   handle when drag handles are on, by its icon and name when they are off;
   Up and Down move it one step. The list re-sorts immediately and the new
   order is saved as each field's `sort` value. The opened card and the
   minicard draw the fields in this order.
4. Fields without an explicit order come after the fields that have one, in
   alphabetical-by-name order, so existing boards created before this feature
   keep their previous order until you drag something.

### Prerequisites

- Setting **Admin only** or **Read-only** requires being a board admin; only
  a board admin can see and toggle the checkboxes.
- Reordering requires being a board member who may change the board (the
  `write` permission, `Utils.canModifyBoard`); anybody else sees no drag
  handle and no hamburger.

## How the numbers are calculated

- **Display order** is each field's `sort`, ascending, lower first
  ([models/lib/customFieldsWD.js](../../../../models/lib/customFieldsWD.js)).
  Two fields with the same `sort`, and fields with no `sort`, are ordered by
  name; fields with no `sort` come after all that have one.
- After a drop, the fields get `sort` 0, 1, 2, ... in their new order, and
  only the fields whose `sort` changed are written (`sortsAfterDrop` in
  [models/lib/cardSettingsCustomFields.js](../../../../models/lib/cardSettingsCustomFields.js)).
- A new field gets `sort` = the number of fields the board already has, so it
  is last ([client/components/sidebar/sidebarCustomFields.js](../../../../client/components/sidebar/sidebarCustomFields.js)).
- Admin only and Read-only have no numbers; both default to off.

## How it works in WeKan

- **Fields**: `adminOnly`, `readOnly` and `sort` on the `customFields`
  definition ([models/customFields.js](../../../../models/customFields.js)),
  `adminOnly` and `readOnly` defaulting to `false`.
- **Admin only is enforced on the server, not only hidden in the UI**
  ([models/lib/adminOnlyCustomFields.js](../../../../models/lib/adminOnlyCustomFields.js),
  [server/lib/adminOnlyCustomFields.js](../../../../server/lib/adminOnlyCustomFields.js)):
  for a user who is not an active admin of the board, the value is replaced
  by `null` in what the server sends (publications, REST, activities and
  history), while the field's id and place stay, so the card editors keep
  working. Such a user also cannot set or clear the value: the write is
  refused and shown in **Admin Panel → Problems** (key
  `authz.admin-only-field`). An export of a board with an Admin only field
  needs board admin access. The card and minicard also leave out the field's
  name for a non-admin (`filterAdminOnlyDefinitions`).
- **Read-only** uses the same write guard (`mayWriteField`): everybody who may
  read the field sees its value, and only a board admin changes it - by hand,
  through the REST API or by a rule.
- **Order**: the drag in Card Settings is
  [client/components/sidebar/sidebar.js](../../../../client/components/sidebar/sidebar.js)
  (`placeCustomFieldOrder`), which writes `sort` through the ordinary
  CustomFields update.
- Tests: `tests/adminOnlyCustomField3141.test.cjs`,
  `tests/readOnlyCustomField.test.cjs`, `tests/readOnlyBleed.test.cjs`,
  `tests/customFieldsSortSchema.test.cjs`, `tests/customFieldsWD.test.cjs`,
  `tests/cardSettingsCustomFields.test.cjs` and
  `tests/playwright/specs/admin-only-custom-fields.e2e.js`.

## Commits

 - [Card Settings: two panes, where the custom fields are ordered](https://github.com/wekan/wekan/commit/2bd5d1180a24bde1fb30acfe75617bb4c68f864e)
 - [read-only custom fields that every member sees and only admins set](https://github.com/wekan/wekan/commit/87ae8895c30c0c46f336d0783ec452230b1ba724)
 - [admin-only custom fields enforced across server boundaries](https://github.com/wekan/wekan/commit/89a65ee7ce765217b57f9c6be35422b9f3d9a3c4)
 - [a boot-crashing invalid schema property on customFields.sort fixed](https://github.com/wekan/wekan/commit/7930da455adbb2951db8fc442f4c6266fe89b1bf)
 - [the Admin only flag on custom field definitions](https://github.com/wekan/wekan/commit/76dcb6575aebd8f597ceb56b6bcc3edc02237251)
 - [a user-settable display order for custom fields, by drag and drop](https://github.com/wekan/wekan/commit/0c6901f3a9eda2efd7e53c85d262add49fb53135)
