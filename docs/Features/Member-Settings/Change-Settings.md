# Member Settings / Change Settings

Open the top-right username menu, then **Change Settings**. This popup contains
personal editing and display choices, including submitting with Enter, opening
multiple cards, the checklist completion sound, the minimum card count and
card-description rescue settings. Click **Save** to apply the form.

To change date format, the first day of the week or the calendar system, use
[Member Settings / Date](Date/README.md).
To control delivery, use [Notifications](Notifications.md).

## New card titles

Two switches decide what the title of a new card becomes when it is typed in
a list's **Add card** form. Both are personal and off by default; click one to
turn it on or off, and a check mark shows that it is on.

| Switch | On | Off (default) |
| --- | --- | --- |
| **Keep #label and @member in new card titles** | a label picked with `#` or a member picked with `@` while typing is added to the card and its text stays in the title | the text is replaced by the label or the member |
| **Turn [label] at the start of a new card title into a label** | `[Fedora] Do a thing` makes the card *Do a thing* with the label *Fedora*, created on the board if it has no label by that name ([#3986](https://github.com/wekan/wekan/issues/3986)) | the title is kept as typed, brackets and all ([#6810](https://github.com/wekan/wekan/issues/6810)) |

Only one `[...]` at the very start of the title is read, and only when more
text follows it: `[] Do a thing`, `[Fedora]` alone and nested brackets stay
literal title text. The label name is matched case-insensitively.

For developers: the setting is `profile.titleBracketLabel`, toggled by the
`toggleTitleBracketLabel` method; the title is parsed by
`quickAddTitleParts()` in `models/lib/quickAddCardLabel.js`, pinned by
`tests/titleBracketLabel6810.test.cjs`.
