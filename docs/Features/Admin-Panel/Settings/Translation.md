# Admin Panel / Settings / Translation

Custom translation strings: a language, the source text, and what it should say
instead. They override the built-in translations for this instance.

The pane is one shared [table page](../../../Features/Page/Table.md): type in the
search box and press Enter, `page X / N` with prev/next, and the total. The **New**
link is the last column's header, and each row has **Edit** and a ⋯ menu that
deletes. One page of 25 rows is fetched at a time, server-side.

A string is stored per language, so the same source text can be overridden
differently in each. WeKan's own translations are not edited here — they come from
[Transifex](https://explore.transifex.com/wekan/wekan/).
