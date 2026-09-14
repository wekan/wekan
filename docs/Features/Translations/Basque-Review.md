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

## 2026-09-14 — Generic member and attachment subjects retained (946e1a29b)

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

All 4,175 unchanged reviews and 234-locale completeness pass. Counts now
stand at 283 pending and 5 restored findings overall.

## 2026-09-14 — Named-subject integration problem confirmed (209d1088b)

The remaining restored subjects are Etiketa hau, Kide hau, Kontrol-zerrenda
hau and Kontrol-zerrendako elementu hau. Their nouns and demonstrative cannot
be accepted in isolation: each template puts its name dropdown/input after
the whole subject, producing noun + hau + selected name + action.

[Patxi Goenaga's EHU grammar chapter, 2022](https://egeo.ehu.eus/kapitulu/ikuspegia/6)
was opened in full. Section 6.2 gives the noun-phrase order with final
quantifier/determiner; section 6.1 explains why a noun requires determination
to function as an argument. This is a grammatical constraint, not a script
check. The source supports reviewing the selected name within the complete
noun phrase; it does not supply exact WeKan named-object wording.

`client/components/rules/triggers/cardTriggers.jade` places spec-label and
spec-member after their restored subject labels. The checklist template does
the same for check-name, spec-comp-check-name and check-item-name.
`client/lib/utils.js`, getTriggerActionDesc, iterates direct trigger-content
children and concatenates text, selected option text and input values in DOM
order. The saved description therefore includes the selected name in the same
position; a CSS-only reorder would leave saved wording incorrect.

Next implementation needs a locale-aware complete named-object construction,
with native name/qualifier order shared by visual controls and saved text.
Preserve control IDs, filters, predicates, other languages and user-entered
names; do not reinterpret names as trusted markup or translate them.
Verify both add/remove checklist rows and complete/incomplete rows, as well
as checked/unchecked items and named members/labels. Positive, negative and
browser tests must cover the full description, not just isolated JSON values.
No restored value is classified from this review. Four restored findings and
283 pending remain. The actual browser rendering has not been tested here.

## 2026-09-14 — Named-subject DOM order repaired (1e4411183)

The synchronous reactive ruleNameBeforeSubject helper selects Basque only.
In all five named-object control rows, the name dropdown/input now precedes
the preserved noun + hau phrase. This keeps the demonstrative at the end of
the subject; other locales retain the previous DOM order. No translation
value, control ID, filter or handler mapping changes. Because the existing
saved-description generator traverses DOM children, saved descriptions use
the same corrected ordering without a separate text-only transformation.
User-entered names remain input/option text, never trusted markup.

Focused locale positive/negative and named-fragment branch checks pass;
all Jade templates compile with the actual build compiler. All retained
reviews and 234-locale completeness pass. Browser spec 88 covers the five
control rows, a persisted checklist description and English ordering.
It is syntax checked but not executed: localhost:3000 has no listening app.
The four restored findings remain open pending browser and full native
phrase verification; compilation alone does not prove their final acceptance.

## 2026-09-14 — Saved-description execution verified (0c51a3261)

The actual getTriggerActionDesc method was extracted and executed in a VM
with DOM/jQuery controls modeled at its boundary. It initially threw because
separator handling referenced the browser-global length. The method now joins
nonempty control fragments, omitting buttons/empty linking-verb text without
leading/trailing separators or depending on browser frame count. Input values,
wildcards, option casing and existing date/time/user-detail branches are kept.

Execution tests verify all four Basque subject phrases in name-first order,
checked/unchecked predicates, literal name markup/emoji text, blank copulas,
buttons, wildcards, user-details and date/time controls. English keeps its
original noun-first order. All Jade templates compile; the browser spec is
successfully registered by Playwright --list with the line reporter. Its
initial default HTML reporter lacked permission to overwrite an existing
report; changing only the reporter resolved registration without filesystem
permission changes. Browser execution and full native fluency remain open.
Four restored and 283 pending findings are not reclassified from VM checks.

Assignee noun-phrase repair **2026-09-14**, local commit `486be5743`:
`r-when-the-assignee` changes **Esleitu hau** (Assign this) to
**Esleitutako erabiltzaile hau** (This assigned user). Existing assignee
terminology and Basque technical references support the component wording.
The actual named-assignee row still places its input after the subject,
unlike the five Basque named-object rows already reordered. Full named
assignee add/remove composition and browser verification remain open.
This lexical repair does not accept the four restored findings. Four
affected test files pass; ledger 18,831, pending 232/restored 4 unchanged.
Source: https://learn.microsoft.com/eu-es/power-platform/admin/create-users

Named-assignee order repair **2026-09-14**, local commit `cff1fdc32`:
`cardTriggers.jade` now applies the same Basque-only name-before-subject
branches to `spec-assignee` as the other named-object controls. Other
locales keep subject-before-name. Focused grammar and actual production
saved-description method checks pass. Playwright spec 88 includes the
assignee row and is syntax checked, but not executed: a fresh localhost
port 3000 probe was refused, so no running app was available.
No locale values/counts changed; the four restored findings and full
assignee add/remove clause/native/browser review remain open. Earlier
notes describing this row as unreordered are superseded by this dated fix.


Browser verification **2026-09-14**, local commit `c9005ee0a`:
Playwright spec 88 executed against the running local Meteor app with
Chromium: **1 passed (3.1s)**. Corrected test fixture ownership, login helper
arguments and resumed-login navigation after reload. Verified all six
named Basque controls, saved Demo checklist description, and unchanged
English subject-before-name order. Earlier browser-unavailable notes are
superseded. This proves rendering and composition, not native fluency of
full add/remove clauses. Pending 232, restored 4 and ledger 18,831 unchanged.
