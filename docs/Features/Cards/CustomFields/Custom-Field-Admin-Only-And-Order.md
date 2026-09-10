# Custom field: Admin only and display order

Two per-field settings for managing a board's [Custom Fields](CustomFields.md)
as they grow in number: an **Admin only** flag that hides a field's value
from everyone but board admins, and a drag-to-reorder **display order** that
controls the order fields are listed and shown on a card.

## Where to find it

**Card → Custom Fields (heading's hamburger) → Add/edit a custom field**,
and the **board sidebar's Custom Fields list** for reordering.

```
┌ Card ───────────────────────────────┐
│ Custom Fields          [ ⋮ ]  <- menu│
│  Release: v2.0                       │
│  Budget: 500                         │
└────────────────────────────────────────┘

┌ Edit custom field ──────────────────┐
│ Name: [ Budget............ ]         │
│ Type: [ Number ▾ ]                   │
│ ☐ Show on card                       │
│ ☐ Automatically on card               │
│ ☐ Always on card                     │
│ ☐ Show label on minicard              │
│ ☑ Admin only          <- board admins│
│                          see it       │
│ [Save]                [Delete]        │
└────────────────────────────────────────┘

┌ Sidebar: Custom Fields ─────────────┐
│ ☰ Release        ✎  <- drag handle   │
│ ☰ Budget         ✎  <- reorder here  │
│ + Add custom field                   │
└────────────────────────────────────────┘
```

## Steps to use it

1. **Admin only** (#3141): open a card, click the Custom Fields heading's
   hamburger menu, click a field to edit it (or **create** a new one), scroll
   to the checkboxes and check **Admin only**. This checkbox is only shown
   to a board admin - a regular board member never sees or can toggle it.
   Once set, a non-admin board member no longer sees that field's value on
   the card or minicard.
2. **Display order** (#4165): open the board sidebar, go to the board's
   Custom Fields list, and drag a field by its handle (the bars icon,
   left of each field) up or down. The list re-sorts immediately and the new
   order is saved as each field's `sort` value.
3. Fields without an explicit order fall back to alphabetical-by-name, so
   existing boards created before this feature keep their previous order
   until you drag something.

## Prerequisites

- Setting **Admin only** requires being a board admin; only a board admin
  can see and toggle the checkbox.
- Reordering requires being a board member (the sidebar's drag handle only
  appears for a signed-in board member).
