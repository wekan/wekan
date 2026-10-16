# Kashmiri translation review

## Primary grammar evidence — 2026-09-14

Koul and Wali, Modern Kashmiri Grammar (Dunwoody Press, 2006), was
retrieved directly and its relevant sections read:
https://ikashmir.net/onkoul/pdf/ModernKashmiriGrammar.pdf

PDF page 205 (zero-based page 204) lists moon as zu:n. PDF page 91
identifies vuch as see. Section 3.4.6.1, PDF pages 124–125, describes
infinitives formed with -UN and agreement with nominative subjects and
transitive nominative objects; case-marked arguments behave differently.
Section 4.3.4.3, PDF pages 175–176, supplies purpose constructions with
the seeing infinitive and ablative/postposition forms. Section 4.3.2.2,
PDF page 167, separately describes nominalized infinitives.

These are primary lexical and grammatical evidence, replacing reliance
on an unread dictionary snippet. They do not attest a complete Hijri
moon-sighting calendar label, its Arabic-script inflections, or tabular
and astronomical-epoch terminology. Extracted legacy-font characters
must not be copied as Unicode spelling evidence. Both existing findings
remain pending; no translation or correction-ledger acceptance is made.

## Kashmiri sighting terminology and source reliability — 2026-09-14

Both ks calendar-system-islamic-rgsa and calendar-system-islamic-tbla
remain pending, respectively English country-only and tabular-only labels.
The sighting qualifier must specify moon observation, not merely Saudi
Arabia. Wiktionary's Kashmiri moon entry gives zoon written زوٗن (initial
zay), not an inferred initial che letter. This supplies a spelling lead,
not proof of the complete sighting label or inflected see construction.
https://en.wiktionary.org/wiki/زوٗن

The linked Grierson primary query was followed directly and returned no
results for this exact Unicode spelling. Do not describe this as a read
primary lemma or as evidence that the word does not exist:
https://dsal.uchicago.edu/cgi-bin/app/grierson_query.py?qs=%D8%B2%D9%88%D9%97%D9%86

A search-indexed M. K. Raina dictionary PDF URL was opened but redirected
to an unrelated BIG777 gambling page. Its indexed dictionary snippet is
not a verified current primary source; no redirected content was used
for translations. Excluded URL:
https://mkraina.com/wp-content/uploads/2025/01/A-Dictionary-of-Peculiar-Uncommon-Kashmiri-Words-and-Phrases-Edition-4.pdf

Generic calendar/Hijri, Saudi Arabia, moon-sighting inflection, tabular
and astronomical-epoch wording still require native evidence and direct
repair. Urdu-only Hijri pages from the search are not Kashmiri evidence.
No translation or ledger acceptance was made. Original pending remains
259, including two Kashmiri findings; full native/browser work stays open.

## Saudi sighting draft — 2026-09-14

Local commit `58809a724` replaces English-only country wording with a
Kashmiri Hijri/calendar, Saudi Arabia and moon-seeing draft. This repairs
the missing observation component as well as the wrong-language seed.
The existing generic Hijri calendar wording is retained.

Primary component sources:
- [Unicode CLDR Kashmiri XML](https://raw.githubusercontent.com/unicode-org/cldr/main/common/main/ks.xml): Saudi Arabia territory spelling.
- [IGNCA sentence of the day, number 50](https://ignca.gov.in/PDF_sentences/Sentectoftheday_050.pdf): indexed Kashmiri football sentence uses the Unicode seeing infinitive. This supports spelling, not lunar-object agreement.
- [Modern Kashmiri Grammar](https://ikashmir.net/onkoul/pdf/ModernKashmiriGrammar.pdf): moon and seeing components, nominalized infinitives and agreement, as read and described above.
- [G. N. Atish native literary text](https://www.kashmirilanguage.com/WORD_Books/GN_Atish_3of3.html): Zoon spelling also occurs in a discussion of Nakhshab's moon. The same page uses Zoon as a person's name; those personal-name occurrences alone are not moon evidence.

**Low confidence:** the assembled phrase is not attested as a complete
calendar name. Infinitive agreement with the feminine moon object,
nominalization and the inflected Arabic-script phrase still require native
review. The attested standalone seeing form does not prove that form is
correct in this compound. This correction does not mark that uncertainty
resolved. Tabular/astronomical epoch wording and the existing civil-calendar
translation also remain open.

Four focused suites pass: exact source placeholders/tags and key order,
correction provenance, newer translations and the specific label. No live
calendar-selector browser test was run. Ledger 19,768, original corrected
15,688, pending 215 (Kashmiri 1), restored 4 unchanged. No remote push.

## Tabular Hijri drafts and civil-word revision — 2026-09-15

Local commit `59541a5ae` repairs the English tabular label and revises the
previous civil label's inappropriate social-word rendering. Both use the
existing Hijri/calendar, table and starting components, plus arithmetic
حساب attested explicitly in the
[primary Bharatavani Hindi–Kashmiri–English dictionary](https://bharatavani.in//kashmiri/dictionarysurf/?did=485&language=Hindi),
entry अंकगणित. This is arithmetic-word evidence, not a full calendar name.
[Unicode CLDR calendar definitions](https://cldr.unicode.org/development/development-process/design-proposals/islamic-calendar-types)
distinguish tabular civil 622-07-16 from astronomical 622-07-15, both Julian.
The explicit ISO starting dates preserve that distinction without confusing
the astronomical epoch with lunar observation. Original civil provenance
and revision reasons remain in the correction ledger.

**Low confidence:** the table-arithmetic compound, starting-date/epoch
formulation, Julian borrowing and complete Arabic-script grammar remain
under native review. Existing source terminology reuse is not independent
proof of those complete phrases. Four focused suites pass, including
negative coverage excluding the old social wording, distinct dates, exact
placeholders, original provenance and newer human translations. A prior
regression expectation for the superseded civil wording was updated.
No live calendar-popup browser test ran. Ledger 19,781; original corrected
15,700, pending 203, restored 4. Kashmiri has no original pending flags,
but these drafts and earlier sighting agreement remain open. No push.
