# Organization-domain requests and card-edit activity

The October 2 batch fills these four source keys in every non-English locale:

- `org-domains-requested`
- `org-domains-request-saved`
- `error-org-domain-reserved`
- `act-editCard`

Existing non-English values were preserved. English regional catalogs keep the
source text. The regression suite checks all 246 catalogs, the exact `__card__`
token, distinct request/success/refusal messages, and selected language and script
checks. Structural checks do not establish fluency.

The first message must say that the **organization administrator requested** the
domains and the **site administrator still needs to assign** them. Saving the
request must not imply approval. The refusal concerns the installation's own
address. The activity message describes a completed card edit, not an instruction.

## Native review needed

Technical terminology and inflection are low confidence especially in these
locales; review the whole sentences, not only the spelling of “domain”:

`ace`, `ak`, `ay`, `bi`, `bm`, `bo`, `bua`, `chr`, `csb`, `cv`, `dz`, `ee`,
`ff`, `fj`, `gn`, `gv`, `haw`, `hsb`, `iu`, `kl`, `kok`, `ks`, `kw`, `lg`,
`lld`, `mai`, `nah`, `nap`, `nd`, `nso`, `om`, `qu`, `rn`, `rup`, `sah`,
`se`, `sm`, `ss`, `st`, `szl`, `tig`, `tlh`, `tn`, `to`, `ts`, `uz-AR`,
`ve`, `ve-CC`, `ve-PP`, `vo`, `wa`, `wa-RR`, `wal`, `wo`, `wuu-Hans`, `zgh`.

The language picker identifies `ve-CC` as Venetian, `ve-PP` as Veps and `wa-RR`
as Waray. Some older domain strings in those files contain the wrong language;
they were not used as translation templates. Broader corrections remain separate
work. Likewise the new Tigre prose must not be replaced by the older Tigrinya
seed, and the new Wolaytta prose must not regain an English sentence behind a
language-name prefix.

## Vocabulary references

These references informed terminology; none is a review of the resulting UI
sentences. Existing locale vocabulary also provided the card, organization,
administrator and save terms, with the wrong-language exceptions above.

- [Volapük dictionary](https://en.wikibooks.org/wiki/Volap%C3%BCk/English-Volap%C3%BCk_dictionary):
  request, wait, website and belong; retain the catalog's `dakipön` for save.
- [Klingon Language Institute: new words](https://www.kli.org/about-klingon/new-klingon-words/w/)
  and [Klingonska dictionary](https://klingonska.org/dict/): website terminology,
  request, wait, give and change. The domain expression follows the catalog.
- [Cornish `govyn`](https://en.wiktionary.org/wiki/govyn): request and its verb.
- [Manx dictionary](https://upload.wikimedia.org/wikipedia/commons/e/e2/The_Manx_dictionary_%28IA_cu31924027086945%29.pdf):
  `aghin`, request.
- [Acehnese `lakee`](https://www.kamusdaerah.com/aceh-indonesia/lakee): request.
- [Cherokee Nation word list](https://language.cherokee.gov/word-list/):
  vocabulary reference; the composed technical clauses still require review.
- [Elias, The Tigre Language of Gindaʿ](https://www.speaktigre.com/_files/ugd/7e068a_adcb2a9df2c340898e3155ef3905c61e.pdf?index=true):
  waiting, possessive constructions and negation;
  [Beurmann's Tigre vocabulary](https://www.speaktigre.com/_files/ugd/7e068a_a5fbea1fb5e544e69d94cab002762da2.pdf?index=true):
  giving.
- [Wolaytta verbs](https://kaikki.org/dictionary/Wolaytta/pos-verb/index.html),
  [Wakasa on Wolaytta passive constructions](https://www.tufs.ac.jp/common/fs/ilr/contents/ronshuu/29/jilr29_sp_Wolaytta14_Wakasa.pdf),
  and [Wolaytta phrasebook](https://en.wikivoyage.org/wiki/Wolayttattuwa_phrasebook):
  giving, requesting and changing. These support roots, not the complete
  specialist wording.
