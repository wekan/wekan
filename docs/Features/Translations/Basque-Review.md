# Basque rule translation review

Reviewed: **2026-09-14**. Review remains incomplete.

The restored completion actions are **Osatzen denean** and
**Osatu gabe markatzen denean**. The generic checklist row supplies
**Kontrol-zerrenda bat** without an additional copula. Specific checklist
rows insert a name after **Kontrol-zerrenda hau**; their complete noun/name
order still needs separate grammatical review.

[Native EHU EEH osatu entry](https://www.ehu.eus/eeh/cgi/bila?h=osatu)
was downloaded directly and decoded as Latin-1 after the web reader failed.
It records list/report completion collocations, including zerrenda osatu and
txostena osatu. This supports the completion verb in an appropriate context,
not the complete product sentence or every sense of the verb.

[Alberdi, Garcia and Ugarteburu, Xgabe tankerako hitz elkartuak](https://ojs.ehu.eus/index.php/ASJU/article/viewFile/8767/7933)
explicitly lists **osatu gabe** among separately written participle/gabe
constructions (printed page 54, PDF page 50). This is evidence for spelling
and negation. It does not establish that **osatu gabe uzten denean** precisely
expresses a transition back to incomplete rather than leaving something
unfinished. The incomplete transition is not accepted solely from these words.

The completed predicate **Osatzen denean** is now retained in local commit
`1e62fca35`. [Native GNOME Basque Bluetooth help](https://help.gnome.org/gnome-help/bluetooth-send-file.html.eu)
uses the same temporal predicate for a completed transfer. Together with
EHU list-completion collocations and the actual generic checklist row without
an extra copula, this supports the completed meaning. It does not validate
the named checklist fragment, incomplete transition or runtime discrepancy.

The application distinction also requires care. In checklistTriggers.js,
completed selects **completeChecklist**, while uncompleted selects
**uncompleteChecklist**. In models/checklistItems.js,
**publishChekListCompleted** and **publishChekListUncompleted** currently both
insert their respective activity only when **isChecklistFinished** is true.
The latter contains an existing comment about unresolved rule behavior.
This is a runtime discrepancy, not evidence that completed and incomplete
are synonymous. Preserve the distinct intended translation meanings; do not
translate the incorrect predicate as if it defined the intended feature.
No runtime reproduction or repair of that separate rule bug was performed.

Directional add/remove clauses also remain open: their final **txartel bat**
noun lacks the destination/source case expected by the corresponding action.
Previously omitting a redundant copula did not repair the whole sentence.
Label/member/attachment fragments cannot be accepted from correct nouns alone.
S3 bucket terminology is retained with the native reference below.

Accepted generic movement and check/uncheck predicates are recorded in
`aba731e82` and `1439c4c61`. Those focused reviews do not certify the other
restored fragments or live browser behavior. The latest completion acceptance resolves one restored finding without
changing its value. Broader clauses and browser validation remain open.

## 2026-09-14 — Completion-status context

[Native EHU eCampus activity-completion guidance](https://www.ehu.eus/eu/web/ecampus/jardueren-jarraipena-egiteko-tresnak-eskuragarritasuna-mugatu-eta-dominak/txostenak)
provides an independent technical reference: it describes manual completion
marking with `jarduera osatu gisa`, conditional completion status and the
checkbox that displays that status. This supports treating completion as a
status, rather than merely leaving work unfinished. It does not supply an
exact incomplete-transition predicate and does not by itself validate
`Osatu gabe uzten denean`.

[The native EHU gabe dictionary](https://www.ehu.eus/eeh/cgi/bila?h=gabe)
defines absence/lack and records both unfinished constructions and
`gabe utzi` collocations. Their existence establishes ordinary grammar,
not the required software state transition. The next repair needs a complete
incomplete-status transition clause; copying the completion phrase with
negation alone is insufficient. Both generic and named trigger options use
the same key, so any replacement must also compose with both noun contexts.
No value is changed or accepted in this review. Runtime and browser checks
remain separate requirements.

## 2026-09-14 — S3 technical loan retained (5bf97e219)

[Native ZIUR Basque technical specification](https://www.contratacion.euskadi.eus/webkpe00-kpeperfi/es/contenidos/anuncio_contratacion/expjaso33672/es_doc/adjuntos/pliego_bases_tecnicas2.pdf)
uses AWS S3 Bucket in storage-service context on printed pages 6 and 7.
The restored label `S3 bucket-a` is retained: the borrowed term is valid
in native technical prose and the suffix supplies the Basque article.
The source attests the technical term, not exact source hyphenation of the
label. In the actual attachment form it identifies the bucket-name input,
with a related description explaining the name used for file storage.
Focused checks preserve the label, description and actual input association.
Broader language and browser verification remain open.

## 2026-09-14 — Incomplete status predicate repaired (33cc02ced)

[Native Moodle activity-completion documentation](https://docs.moodle.org/all/eu/Jarduera-osaketa)
explains completed marking and a reset to `osatu gabea` status. This supplies
independent software-state evidence beyond the spelling of gabe. The earlier
phrase `Osatu gabe uzten denean` is replaced with `Osatu gabe markatzen denean`
to express marking incomplete, rather than merely leaving work unfinished.
The complete temporal clause is an adaptation, not an exact source quotation.
Earlier paragraphs describe why the previous wording was not accepted.

The generic checklist subject composes with the new predicate without an
extra copula. Focused exact-value, ambiguity-negative and actual incomplete
option wiring checks pass. The named subject/name order and broader native
clause review remain open; this does not repair the runtime discrepancy above.
All 18,659 corrections, 4,170 retained reviews and 234-locale completeness
checks pass. One restored finding is now corrected: 10 restored findings
and 288 pending remain. Browser execution was not performed.

## 2026-09-14 — Generic checklist-item subject retained (d36499d43)

The restored `r-when-a-item` = Kontrol-zerrendako elementu bat is retained.
Its singular subject composes with Markatzen denean and Desmarkatzen denean
in the generic checklist-item row, without an extra copula or a card noun.
The -ko construction identifies an item belonging to the checklist; bat
retains the indefinite singular. This is a contextual grammatical review,
not acceptance merely because the words use Latin script.

[Basque software reference](https://learn.microsoft.com/eu-es/power-platform/well-architected/experience-optimization/design-standards)
uses kontrol-zerrendako; [control properties](https://learn.microsoft.com/eu-es/power-apps/maker/canvas-apps/reference-properties)
uses elementuak for list/control items. These support component terminology,
not an exact quotation of the full WeKan sentence or human provenance for
those documentation translations. The complete generic construction is
reviewed against its actual action predicates. The named-item subject and
name order remain open; this conclusion is not extended to that row.

Focused exact-subject, both assembled actions, copula-negative and actual
row wiring checks pass. All 4,171 unchanged reviews and 234-locale completeness
checks pass. One restored finding is retained: 9 restored and 288 pending
remain. Browser execution and broader language review remain open.

## 2026-09-14 — Restored movement conditions retained (2bb54a30b)

`r-moved-to` = Eramaten denean hona: and `r-moved-from` = Eramaten denean
hemendik: are retained. The actual board trigger row assembles Txartel bat,
this conditional action, and a separately labeled zerrenda name field.
The colon introduces that field, so these are directional UI fragments rather
than an attempt to inflect the later user-entered list name. Eramaten denean
expresses when a card is moved; destination and origin remain different.
No extra da copula is inserted by the Basque rule grammar helper.

[EHU eraman entry](https://www.ehu.eus/eeh/cgi/bila?h=eraman) supplies eraman /
eramaten and its carrying/movement sense. [EHU hona entry](https://www.ehu.eus/eeh/cgi/bila?h=hona)
defines the directional adverb as leku honetara. Both pages were fetched
and decoded using their declared ISO-8859-1 encoding; browser-tool decoding
failed, not the underlying source fetch. The hemendik headword search did
not return a dictionary entry and is not claimed as evidence.
[Native GNOME Boxes instructions](https://teams.pages.gitlab.gnome.org/Websites/help.gnome.org/gnome-boxes/create.html.eu)
use Sortu makina birtual bat hemendik: before separate source choices.
That attests the colon/source-field construction, not the full WeKan clause.

The full current UI fragments were reviewed against their control layout and
trigger handler: moved-to supplies the destination list and leaves oldListName
as wildcard; moved-from supplies oldListName from the selected list. Exact
restored values, distinct directions, composed label/copula-negative and
actual option/handler mapping checks are added. No locale value changes.
Broader native style and running-browser verification remain open; this
acceptance is limited to these directional fragments, not other named subjects.

All 4,173 unchanged reviews and 234-locale completeness pass. Two restored
findings are retained; 7 restored and 283 pending findings remain overall.

## 2026-09-14 — Generic member and attachment subjects retained

Restored `r-when-a-member` = Kide bat and `r-when-a-attach` = Eranskin bat
are retained. The generic rows use an indefinite singular subject followed
by add/remove temporal predicates and a colon introducing the card field.
Bat follows the noun and preserves one unspecified member/attachment.
The resulting control labels were reviewed for both actions; they do not
insert an extra copula. Named subjects have a different construction and
are not accepted by this review.

[EHU kide](https://www.ehu.eus/eeh/cgi/bila?h=kide) defines membership in a
group; [EHU eranskin](https://www.ehu.eus/eeh/cgi/bila?h=eranskin) defines
something attached to something else. Both were directly fetched and decoded
as declared ISO-8859-1. [Official council description](https://www.osakidetza.euskadi.eus/zibersegurtasunaren-euskal-agentziaren-administrazio-kontseilua/webosk00-oskcon/eu/)
uses kide bat for an individual member. [GNOME Evolution documentation](https://help.gnome.org/evolution/mail-attachments-sending.html.eu)
uses eranskinak for file attachments and explains the attached file copy.
Its untranslated English instructions are not native terminology evidence.

Exact subjects, both assembled action labels, copula negatives and actual
row wiring checks pass. Browser and broader style review remain open.
No translations change; two restored findings are retained.
