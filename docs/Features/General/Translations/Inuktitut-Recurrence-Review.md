# Inuktitut recurrence and reset review

Reviewed **2026-09-14**. Six title/off findings remain open. No value is
accepted merely because it uses syllabics or resembles a dictionary stem.

The two menu labels and their popup titles currently share
`Kingullugu aturaaqattaq`. Both off options also share
`Aasaali (aturaaqattaqanngittuq)`. These identical labels conceal
the difference between the two scheduled operations.

`server/cardRecurrenceSchedule.js:createCardRecurrence` inserts a fresh card
in the same board/swimlane/list and timestamps the source. It carries title,
description, labels and custom fields, but does not copy checklists, members
or due dates. Therefore recurrence must not imply merely reopening the same
card, resetting its checklist or repeating a password-reset operation.

`server/checklistResetSchedule.js:applyChecklistAutoReset` changes finished
items to `isFinished: false` and timestamps the existing checklist. It does
not insert a fresh checklist or card. `models/checklists.js:setResetInterval`
sets the interval; selecting it does not immediately clear items. The off
label must disable that scheduled action, not imply deleting the checklist.

The [Inuktut Uqausiliurut affix dictionary](https://www.taiguusiliuqtiit.ca/en/file-download/download/public/56)
was downloaded directly and extracted locally on the review date. Printed
page 141 defines `-qattaq-` as regularly repeated action. Printed page 66
supports `-kkanniq-` for doing something again; page 88's `-liqqik-` entry
also gives starting again. These support component meanings, not a complete
software reset or recurrence noun. Verify the page number against the entry
when citing an individual example; PDF page numbers include front matter.

The [University of Toronto postbase dictionary](https://ajohns.artsci.utoronto.ca/inuit/UIDP/taq3.html)
explicitly distinguishes repeated actions at one time from repetition on
separate occasions. Its Utkuhiksalingmiut dialect cannot automatically define
an Eastern Inuktitut product label. A recurring scheduled action needs the
separate-occasion meaning. A generic return verb is not proof of creating a
fresh copy.

Microsoft's software guide supports copy terminology in its page-34 menu
examples, but combining that term with a repeat affix still requires complete
native construction review. The reset lead in Multitran is secondary and
lists several distinct senses; it is not sufficient primary evidence for
this checklist action. Preserve the already reviewed daily, weekly and
monthly choices. Complete heading/off wording and browser review remain open.
