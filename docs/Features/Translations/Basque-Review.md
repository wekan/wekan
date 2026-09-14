# Basque rule translation review

Reviewed: **2026-09-14**. Review remains incomplete.

The restored completion actions are **Osatzen denean** and
**Osatu gabe uzten denean**. The generic checklist row supplies
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
