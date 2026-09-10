# Checklists

Two management features for a card's checklists: an **automatic reset**
interval that unchecks all of a checklist's items on a recurring schedule,
and a **bulk text edit** that lets you rewrite a whole checklist's items as
one block of plain text instead of editing items one at a time.

## Where to find it

**Card → a checklist's own hamburger menu (⋮)** - reset interval and bulk
text edit are both entries in that menu.

```
┌ Card ────────────────────────────────┐
│ Checklist: Daily routine     [ ⋮ ] <-menu
│  ☑ Water the plants                   │
│  ☐ Check backups                      │
└──────────────────────────────────────────┘

┌ Checklist actions ─────────────────────┐
│ Export / Import ...                     │
│ Edit checklist items as text ...  <-here│
│ ---------------------------------------- │
│ Delete ...   Move ...   Copy ...        │
│ Checklist reset interval ...      <-here│
│ Check all items    Uncheck all items    │
│ Hide checked items [ toggle ]           │
└────────────────────────────────────────────┘

┌ Checklist reset interval ──────────────┐
│ ○ None                                  │
│ ○ Daily                                 │
│ ○ Weekly                                │
│ ○ Monthly                               │
└────────────────────────────────────────────┘

┌ Edit checklist items as text ──────────┐
│ [x] Water the plants                    │
│ [ ] Check backups                       │
│ [ ] Feed the cat                        │
│                                          │
│ [Save]                                  │
└────────────────────────────────────────────┘
```

## Steps to use automatic reset

1. Open a card, click a checklist's hamburger menu (⋮).
2. Click **Checklist reset interval ...**.
3. Pick **Daily**, **Weekly** or **Monthly** to make the checklist
   automatically uncheck all of its items once that interval is due again
   (counted from the last reset, or from the checklist's creation date if it
   has never reset) - or pick **None** to turn automatic reset off.
4. Nothing else is needed: a server-side job unchecks the items once the
   interval comes due, no matter who is logged in at the time.

## Steps to use bulk text edit

1. Open a card, click a checklist's hamburger menu (⋮).
2. Click **Edit checklist items as text ...**.
3. The textarea shows one line per existing item, `[x]` for a checked item
   and `[ ]` for an unchecked one.
4. Add, remove, reorder or retype lines directly in the textarea - typing,
   pasting, or cutting/pasting lines between two checklists (open the popup
   on each and copy the relevant lines) all work, since it is plain text.
5. Click **Save**. The checklist's items are replaced to match the text
   exactly, in the order the lines appear, with the `[x]`/`[ ]` prefix
   controlling each item's checked state.

## Prerequisites

- Both actions require the same permission as editing the checklist itself
  (a board member who can modify the card).
- Automatic reset needs no extra setup beyond picking an interval - there is
  no separate cron/service to configure.
