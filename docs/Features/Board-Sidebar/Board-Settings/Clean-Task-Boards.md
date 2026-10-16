# Cleaner task boards

Board Settings → Card offers the following optional controls. They apply to the
whole board and can be changed by a board administrator.

- **Show on Minicard → Collapse:** hide the collapse caret. Hidden carets do not
  leave previously collapsed cards inaccessible: the full card contents display.
  Re-enabling the control restores the user's saved collapse preference.
- **Show on Minicard → Labels ↑ Title:** display the existing labels above the
  title. Labels still obey their visibility and text/bar settings, appear only
  once, and disappear when the card is collapsed. The default placement and saved
  field order remain unchanged when this option is off.
- **Show on Card → Checklists Due:** hide checklist due-date controls and badges
  without deleting dates. When enabled, a checklist without a due date has a
  small, keyboard-accessible clock beside its title. Set dates retain their badge.
  Individual checklist-item deadlines are a separate existing control.
- **Show on Card → Checklists Title:** hide the outer Checklists section heading.
  Checklist titles, add controls, progress and items remain available even if the
  section was previously collapsed.

Existing boards keep their collapse control and checklist headings/dates. Labels
above the title is off by default. These presentation options do not change card
content, stored dates or edit permissions.

The existing Member Settings → Font size presets include 80% and 90% for a more
compact view. They scale card titles, headings, text and popup text. Smaller
presets also reduce checklist heading padding, section spacing and Card Settings
row padding; 100% and larger presets preserve the previous spacing.

## Dates without time

The personal card date-format selector and Admin Panel → Visibility → Date Format
for everyone offer three additional **Date: …** formats: YYYY-MM-DD, DD-MM-YYYY
and MM-DD-YYYY without time. The original choices retain time where the display
normally includes it. The admin override can hide the personal selector, as before.

Date-only display applies to the selected calendar (including Gregorian and
Jalali) and export formatting. It suppresses time consistently, rather than
assuming that noon or midnight is an unwanted default. Stored timestamps,
time-zone calculations, deadlines, reminders and date/time editing are unchanged.

## September 2026 feedback coverage

The eight observations supplied with screenshots were checked against source:

| Request | Result |
| --- | --- |
| Hide minicard collapse control | Added the board option above. |
| Completion checkbox beside title | Already fixed by the flex title row; retained. |
| Labels above title; disabled ordering arrows | Added optional label placement. Existing disabled arrow state and activation guard remain. |
| Smaller opened-card and settings text | Existing per-user size presets retained; compact spacing added. |
| Hide personal date-format selector | Existing admin date-format policy retained. |
| Date formats without time | Added date-only choices for users and the admin default. |
| Hide checklist Due; smaller unset control | Added visibility setting and inline clock. |
| Redundant checklist headings | Added an option to hide the outer section heading. |

All labels reuse existing translated terms. Existing human translations are not
replaced. The new options complement Card Settings rather than changing its
established default field order.
