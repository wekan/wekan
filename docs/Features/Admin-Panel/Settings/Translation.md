# Admin Panel / Settings / Translation

Custom translation strings: a language, the source text, and what it should say
instead. They override the built-in translations for this instance.

The pane is one shared [table page](../../../Features/Page/Table.md): type in the
search box and press Enter, `page X / N` with prev/next, and the total. The **New**
link is the first column's header, and each row has **Edit** and a ⋯ menu that
deletes. One page of 25 rows is fetched at a time, server-side.

The same URL has a semantic Legacy HTML4 table when JavaScript drag and drop is
not available. Its labelled controls provide search, create, edit, previous and
next page, and two-step delete with signed POST forms; they need neither
JavaScript nor cookies and follow source order for keyboard navigation.

Both renderers call the same Global Admin-only service. The browser submits only
a bounded search string, never a MongoDB selector; the server escapes it as a
literal case-insensitive search and caps every result window at 25. Create,
update and delete validate bounded values and exact document IDs. Direct DDP
collection writes are denied and recorded as `TranslationBleed` in Admin Panel /
Problems / Security with available request and actor context.

A string is stored per language, so the same source text can be overridden
differently in each. WeKan's own translations are not edited here — they come from
[Transifex](https://explore.transifex.com/wekan/wekan/).
