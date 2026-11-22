# WeKan compliance gap analysis - legal sources (checked 2026-11-22)

Companion to [README.md](README.md). Every legal citation in
that report points at an entry below. Each entry gives the official
identifier, the official link, what the link answered on 2026-11-22, the
version/consolidation that was read, the date the obligation **applies**, and
a short quotation of the sentence the report relies on.

Method, following the lesson of the Pandex HN thread
(<https://news.ycombinator.com/item?id=50593481>): no text was taken from
memory. Each article was read from an official publisher or from Pandex
(<https://www.pandex.io>, MCP endpoint `https://api.pandex.io/mcp`, which
serves the Publications Office / national official texts; only law-lookup
queries were sent, no repository or personal data). Pandex allows 50
anonymous requests per day; when that ran out, EU texts were read from the
Publications Office's own Cellar (`publications.europa.eu/resource/celex/...`)
and amendments were checked with the Cellar SPARQL endpoint
(`cdm:resource_legal_amends_resource_legal`). Link checks used
`curl -s -o /dev/null -w '%{http_code}' -L -A 'WeKan-compliance-link-check/1.0'`.
**EUR-Lex note.** Every `eur-lex.europa.eu` and `data.europa.eu/eli` link
answers **HTTP 202 with an empty body and `x-amzn-waf-action: challenge`**
(AWS WAF bot challenge) to any non-browser client. The links are correct and
open in a browser; the text behind them was verified through Pandex and
Cellar instead, which hold the same Official Journal documents.

Status words: **VERIFIED** (text read from an official source, quote below),
**UNVERIFIED** (could not be confirmed in an official source - reason given;
the report does not rely on it as fact).

---

## Which obligations apply on 2026-11-22

| Applies today | Applies later | Not applicable to WeKan as such |
|---|---|---|
| GDPR (since 2018-05-25); ePrivacy Art. 5(3) as transposed (DE § 25 TDDDG; UK PECR reg. 6 as substituted 2026-02-05); NIS2 national laws (Member State measures from 2024-10-18; DE BSIG 2025 of 2025-12-02) - for operators that are essential/important entities; EAA (since 2025-06-28) - only for in-scope consumer services; Web Accessibility Directive (public-sector sites since 2019/2020, apps since 2021-06-23); Data Act (since 2025-09-12, Chapter VI switching for SaaS/cloud providers); e-Commerce Dir. Art. 5 / § 5 DDG (since 2024-05-14) / § 5 ECG / MedienG § 24-25; **CRA Art. 14 reporting (since 2026-09-11)** and CRA Chapter IV (since 2026-06-11); HIPAA Security Rule (unchanged since 2013); CCPA/CPRA statute (version effective 2026-01-01) and CCPA regulations (effective 2026-01-01); LGPD (sanctions since 2021-08-01); PIPEDA; Australian Privacy Act (compilation C2026C00227, 2026-06-04); PIPL (since 2021-11-01); APPI; POPIA | **CRA in full: 2027-12-11** (Art. 71(2)) - incl. Art. 13 manufacturer duties, Annex I, Art. 24 steward duties; CCPA ADMT regulations: compliance by **2027-01-01** (11 CCR § 7200(b)); HIPAA Privacy Rule amendment to § 164.524 etc.: effective **2027-01-19** (91 FR 74848); EAA Art. 4(8) derogation up to 2027-06-28, service-provider transition to 2030-06-28 (Art. 32); AI Act high-risk chapters 2027-12-02 / 2028-08-02 (as amended by Reg. (EU) 2026/1744); India DPDP core duties (UNVERIFIED date, reported as 2027-05-13); HIPAA Security Rule NPRM of 2025-01-06 (proposed only, not law) | AI Act (no AI system in WeKan); eIDAS (no trust services); EO 14028 (binds US federal agencies/their suppliers, not WeKan); NIS2 directly (it binds entities, not software) |

---

## EU instruments

### [GDPR] Regulation (EU) 2016/679 - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/reg/2016/679/oj> (202 WAF challenge; ELI
  `http://data.europa.eu/eli/reg/2016/679/oj`). CELEX 32016R0679.
- Version read: Pandex `eu.legislation:32016R0679`; latest consolidation in
  Cellar `02016R0679-20160504` (corrigendum). Cellar lists **no amending act**
  (SPARQL, 2026-11-22).
- Applies: from 25 May 2018 (Art. 99(2): "It shall apply from 25 May 2018.").
- Quotes:
  - Art. 5(1)(e): "kept in a form which permits identification of data
    subjects for no longer than is necessary for the purposes".
  - Art. 7(1): "the controller shall be able to demonstrate that the data
    subject has consented".
  - Art. 8(1): child "at least 16 years old ... Member States may provide by
    law for a lower age ... not below 13 years."
  - Art. 9(1)/(2)(b): special categories incl. health; employment-law
    exception.
  - Art. 13(1): information "at the time when personal data are obtained";
    (1)(b) "contact details of the data protection officer"; (2)(a) storage
    period.
  - Art. 15(3): "The controller shall provide a copy of the personal data
    undergoing processing ... in a commonly used electronic form."
  - Art. 17(1): "the right to obtain from the controller the erasure of
    personal data concerning him or her without undue delay".
  - Art. 18(1), Art. 21(1): restriction; objection to Art. 6(1)(e)/(f)
    processing.
  - Art. 20(1): data "in a structured, commonly used and machine-readable
    format".
  - Art. 22(1): no decision "based solely on automated processing".
  - Art. 25(2): "by default, only personal data which are necessary for each
    specific purpose".
  - Art. 27(1): EU representative where Art. 3(2) applies.
  - Art. 28: processor contract (the DPA).
  - Art. 30(1) record of processing; Art. 30(5): not for "fewer than 250
    persons unless ... not occasional, or ... special categories".
  - Art. 32(1)(a)-(d): encryption; "ongoing confidentiality, integrity,
    availability and resilience"; restore availability; regular testing.
  - Art. 33(1): notify "not later than 72 hours"; Art. 34 data subjects.
  - Art. 37(1): DPO when public authority / large-scale monitoring /
    large-scale special categories.
  - Art. 44-49: transfers (Chapter V); Art. 88: employment context.

### [EPD] Directive 2002/58/EC (ePrivacy) - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/dir/2002/58/oj> (202 WAF). Latest
  consolidation `02002L0058-20091219` (amended by 2006/24/EC, 2009/136/EC).
- Applies: through national law (DE § 25 TDDDG, UK PECR reg. 6, ...).
- Art. 5(3): storing or accessing information on the terminal "only allowed
  on condition that the subscriber or user concerned has given his or her
  consent ... This shall not prevent any technical storage or access ... as
  strictly necessary" for a service explicitly requested.

### [NIS2] Directive (EU) 2022/2555 - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/dir/2022/2555/oj> (202 WAF). Latest
  consolidation `02022L2555-20221227`; no amending act in Cellar.
- Applies: national measures "from 18 October 2024" (Art. 41(1)); binds
  **entities** of Annex I/II that are medium-sized or larger (Art. 2(1)) or
  listed regardless of size (Art. 2(2)) - i.e. some WeKan **operators**, not
  WeKan.
- Art. 21(2): measures (a) risk analysis ... (b) "incident handling" (c)
  "business continuity, such as backup management and disaster recovery" (d)
  supply chain (e) "vulnerability handling and disclosure" (f) effectiveness
  (g) cyber hygiene/training (h) "cryptography and, where appropriate,
  encryption" (i) "access control policies and asset management" (j)
  "multi-factor authentication or continuous authentication".
- Art. 23(4): early warning "within 24 hours", notification "within 72 hours".
- Art. 12(1): each Member State designates a CSIRT as CVD coordinator - an
  obligation of Member States, not of software projects.
- National example - Germany: [BSIG] BSI-Gesetz 2025 (NIS2UmsuCG,
  Ausfertigung 02.12.2025, last amended 22.10.2026),
  <https://www.gesetze-im-internet.de/bsig_2025/__30.html> (200) § 30
  Risikomanagementmaßnahmen (point 10: "Multi-Faktor-Authentifizierung"),
  <https://www.gesetze-im-internet.de/bsig_2025/__32.html> (200) § 32
  Meldepflichten ("spätestens jedoch innerhalb von 24 Stunden").
  Exact in-force date of BSIG 2025: UNVERIFIED (not shown on the page read).

### [CRA] Regulation (EU) 2024/2847 (Cyber Resilience Act) - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/reg/2024/2847/oj> (202 WAF). CELEX
  32024R2847, consolidation `02024R2847-20241120`; Cellar lists one amending
  act, 32025R0327 (European Health Data Space Regulation), not relevant here.
- Applies (Art. 71(2)): "This Regulation shall apply from 11 December 2027.
  However, Article 14 shall apply from 11 September 2026 and Chapter IV
  (Articles 35 to 51) shall apply from 11 June 2026." Art. 69(3): Art. 14
  applies also to products "placed on the market before 11 December 2027".
- Art. 3(13) manufacturer: "a natural or legal person who develops ... and
  markets them under its name or trademark, whether for payment,
  monetisation or free of charge".
- Art. 3(14) open-source software steward: "a **legal person**, other than a
  manufacturer, that has the purpose or objective of systematically providing
  support on a sustained basis for the development of specific products ...
  qualifying as free and open-source software and intended for commercial
  activities".
- Art. 3(22) making available on the market: "in the course of a commercial
  activity, whether in return for payment or free of charge". Art. 3(48) FOSS.
- Recital 15: commercial activity may be characterised "by charging a price
  for technical support services where this does not serve only the
  recuperation of actual costs, by an intention to monetise, for instance by
  providing a software platform through which the manufacturer monetises
  other services ... Accepting donations without the intention of making a
  profit should not be considered to be a commercial activity."
- Recital 18: FOSS "not monetised by their manufacturers should not be
  considered to be a commercial activity"; "the mere presence of regular
  releases should not in itself lead to the conclusion" of commercial supply;
  contributors to projects "not under their responsibility" are out of scope.
- Recital 19: stewards are "legal persons", e.g. "certain foundations as well
  as entities that develop and publish free and open-source software in a
  business context".
- Art. 13(1) Annex I Part I; 13(8) vulnerabilities handled "for the support
  period"; support period "shall be at least five years" (unless expected
  use is shorter); 13(9) each security update available "for a minimum of 10
  years or for the remainder of the support period"; 13(17) "single point of
  contact"; 13(18) Annex II information; 13(19) support-period end date
  "including at least the month and the year".
- Art. 14(1)-(2): actively exploited vulnerability - early warning "within 24
  hours", notification "within 72 hours", final report "no later than 14
  days after a corrective or mitigating measure is available"; 14(3)-(4)
  severe incidents; 14(8) inform impacted users.
- Art. 24(1) steward cybersecurity policy; 24(2) cooperate with market
  surveillance; 24(3) Art. 14(1) applies to stewards "to the extent that they
  are involved in the development". Art. 64(10)(b): fines "shall not apply
  to ... any infringement of this Regulation by open-source software
  stewards".
- Annex I Part I(2): (b) "secure by default configuration"; (d)
  "authentication, identity or access management systems"; (e) "encrypting
  relevant data at rest or in transit"; (f) integrity; (g) data
  minimisation; (l) "recording and monitoring relevant internal activity ...
  with an opt-out mechanism for the user"; (m) "securely and easily remove on
  a permanent basis all data and settings".
- Annex I Part II: (1) "drawing up a software bill of materials in a commonly
  used and machine-readable format covering at the very least the top-level
  dependencies"; (2) remediate without delay, security updates separate from
  feature updates where feasible; (4) publish fixed vulnerabilities; (5)
  "policy on coordinated vulnerability disclosure"; (6) "contact address for
  the reporting"; (7) secure update distribution; (8) disseminate security
  updates without delay with advisory messages.
- Annex II: 2 single point of contact and CVD policy; 7 "the end-date of the
  support period"; 8(d) "how user data can be securely removed"; 9 "**If the
  manufacturer decides** to make available the software bill of materials to
  the user, information on where" - i.e. publishing the SBOM is optional.

**CRA conclusion for WeKan.**
1. *Steward regime (Art. 24) does not fit WeKan.* A steward must be a
   **legal person** (Art. 3(14), recital 19). WeKan's own commercial-support
   page (https://wekan.fi/commercial-support/) says "WeKan (VAT
   Number: FI34047245) is a Finnish Sole Proprietorship" - a natural person
   trading under a name, not a separate legal person. (That a Finnish
   toiminimi is not a legal person is general Finnish law and was not read
   from an official Finnish source here - UNVERIFIED detail.)
2. *Is WeKan "made available on the market in the course of a commercial
   activity"?* The premise "free, non-commercial" is **not supported** by
   WeKan's own website: the same page offers paid features, fixes and
   support ("1 Support Case: 100 euro", "Hourly price: 100 euro/h", yearly
   plans 500-5000 euro) and an "Official SaaS with Admin Panel: 50
   euro/year". Under recital 15, "charging a price for technical support
   services where this does not serve only the recuperation of actual costs"
   or "an intention to monetise" can characterise commercial supply; the page
   also says "All grants and revenue are dedicated directly to the
   maintenance and FLOSS development of WeKan", which argues the other way.
   Recital 18 says regular releases and financial support do not by
   themselves make it commercial. **Result: a borderline case that the text
   does not settle. If the paid support/SaaS is treated as monetisation,
   Lauri Ojansivu is the *manufacturer* (Art. 3(13) includes natural
   persons, "free of charge" included) with full Art. 13/14 + Annex I/II
   duties; if not, WeKan is outside the CRA entirely (neither manufacturer
   nor steward).** The prudent reading is to prepare for manufacturer duties:
   Art. 14 reporting already applies (since 2026-09-11, also to products
   placed on the market before 2027-12-11, Art. 69(3)); the rest from
   2027-12-11. Obtain legal advice; guidance from the Commission on recital
   15 was not checked here.
3. *Organisations that sell or integrate WeKan* (e.g. bundle it in a paid
   product) are manufacturers of their product and must do due diligence on
   it as a FOSS component (Art. 13(5)). *Organisations that only self-host
   WeKan* internally are users, not economic operators; a pure SaaS offering
   is outside the CRA (the CRA covers products; SaaS falls under NIS2 if the
   provider is in scope) - the SaaS recital was not re-read here, so that
   last point is UNVERIFIED.

### [EAA] Directive (EU) 2019/882 (European Accessibility Act) - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/dir/2019/882/oj> (202 WAF); read from
  Cellar (OJ text, consolidation `02019L0882-20190607`, no amending act).
- Applies: national measures "from 28 June 2025" (Art. 31(2)); Art. 4(8)
  optional to 28 June 2027 (Art. 31(3)); transitional period for services to
  28 June 2030 (Art. 32(1)).
- Scope Art. 2(2): only listed **services provided to consumers** -
  electronic communications, audiovisual access, passenger transport
  elements, consumer banking, e-books, "e-commerce services" ("with a view to
  concluding a consumer contract"). A B2B/internal kanban tool is **not** in
  that list. Art. 4(5): "Microenterprises providing services shall be exempt".
- Art. 4(1) and Annex I: accessibility requirements. Art. 13(2) and
  **Annex V**: the service provider puts information "in the general terms
  and conditions, or equivalent document" - this is *not* the public-sector
  accessibility statement.

### [WAD] Directive (EU) 2016/2102 (Web Accessibility Directive) - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/dir/2016/2102/oj> (202 WAF); read from
  Cellar (OJ text).
- Applies to websites and mobile apps of **public sector bodies** (Art. 1):
  new websites from 23 Sep 2019, all websites from 23 Sep 2020, mobile apps
  from 23 June 2021 (Art. 12(3)).
- Art. 7(1): "public sector bodies provide and regularly update a detailed,
  comprehensive and clear accessibility statement". This is the legal basis
  of WeKan's `/accessibility` page when a public body runs WeKan.

### [EN301549] EN 301 549 V3.2.1 (2021-03) - VERIFIED (version)
- Link: <https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf> (200).
- The PDF is V3.2.1 (2021-03) and its web requirements are written against
  **WCAG 2.1** (clauses 9.x "WCAG 2.1"). A newer EN 301 549 that references
  WCAG 2.2, and its citation in the OJ as the harmonised standard, is
  **UNVERIFIED** (not found in an official source during this check).

### [DA] Regulation (EU) 2023/2854 (Data Act) - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/reg/2023/2854/oj> (202 WAF); read from
  Cellar (OJ text, consolidation `02023R2854-20231222`, no amending act).
- Applies "from 12 September 2025" (Art. 50).
- Art. 1(1)(a) / Art. 4: data of **connected products** - not WeKan.
- Art. 2(8) "data processing service" (on-demand, scalable computing
  resources) and Art. 23: "Providers of data processing services shall take
  the measures provided for in Articles 25, 26, 27, 29 and 30 to enable
  customers to switch". Relevant to operators selling **WeKan as SaaS**
  (export of exportable data, switching), not to the software as such.

### [ECD] Directive 2000/31/EC (e-Commerce) - VERIFIED
- Link: <https://eur-lex.europa.eu/eli/dir/2000/31/oj> (202 WAF); Cellar.
- Art. 5(1): the service provider renders "easily, directly and permanently
  accessible ... (a) the name ... (b) the geographic address ... (c) ...
  electronic mail address". Transposed by every Member State; § 5 DDG and
  § 5 ECG below are two of those transpositions.

### [AIA] Regulation (EU) 2024/1689 (AI Act) - VERIFIED, amended
- Link: <https://eur-lex.europa.eu/eli/reg/2024/1689/oj> (202 WAF). Cellar
  shows **amendment by Regulation (EU) 2026/1744 of 8 July 2026** and
  consolidation `02024R1689-20260727`.
- Art. 113 (consolidated): applies from 2 August 2026; high-risk Annex III
  systems "2 December 2027", Annex I systems "2 August 2028". Quoting the
  2024 OJ text ("Article 6(1) ... from 2 August 2027") would now be wrong -
  the exact failure the Pandex thread warns about.
- WeKan contains no AI system, so none of this applies to it.

### eIDAS - not re-checked
- Regulation (EU) No 910/2014 as amended by Regulation (EU) 2024/1183 - the
  report only says WeKan offers no trust services; no article is relied on.
  UNVERIFIED (not fetched).

---

## National imprint and cookie rules

### [DDG5] Germany - § 5 Digitale-Dienste-Gesetz (DDG) - VERIFIED
- Link: <https://www.gesetze-im-internet.de/ddg/__5.html> (200).
- Version: DDG of 6 May 2024 (BGBl. 2024 I Nr. 149), "zuletzt durch Artikel 1
  des Gesetzes vom 12. Mai 2026 (BGBl. 2026 I Nr. 138) geändert" (site notes
  that amendment as textually incorporated). The DDG replaced the
  Telemediengesetz (TMG) and its § 5; the DDG footnote says §§ 1-6 implement
  Directive 2000/31/EC. In force since 14 May 2024 (date per BGBl.; the
  gesetze-im-internet.de page shows only Ausfertigung 06.05.2024 - the
  14 May date itself is UNVERIFIED here).
- § 5(1): "Diensteanbieter haben für geschäftsmäßige, in der Regel gegen
  Entgelt angebotene digitale Dienste folgende Informationen, die leicht
  erkennbar und unmittelbar erreichbar sein müssen, ständig verfügbar zu
  halten: 1. den Namen und die Anschrift ... 2. Angaben, die eine schnelle
  elektronische Kontaktaufnahme ... einschließlich der Adresse für die
  elektronische Post, ... 4. ... Handelsregister ... 6. ...
  Umsatzsteueridentifikationsnummer".
- Consequence for WeKan: applies to the **operator** of a WeKan instance that
  is offered "geschäftsmäßig" (commercially, e.g. a hoster or a company's
  public instance). A purely internal intranet instance is arguably not an
  offered service - a legal assessment for the operator. "ständig verfügbar"
  and "unmittelbar erreichbar" mean the link must be reachable from every
  page, not only the login page.
- Editorial/journalistic content: § 18 Medienstaatsvertrag - UNVERIFIED (not
  fetched).

### [TDDDG25] Germany - § 25 TDDDG (formerly TTDSG) - VERIFIED
- Link: <https://www.gesetze-im-internet.de/ttdsg/__25.html> (200).
- § 25(1) storage/access only with consent; § 25(2) Nr. 2 no consent where
  "unbedingt erforderlich, damit der Anbieter eines digitalen Dienstes einen
  vom Nutzer ausdrücklich gewünschten digitalen Dienst zur Verfügung stellen
  kann" - covers `meteor_login_token`.

### [ECG5] Austria - § 5 E-Commerce-Gesetz (ECG) - VERIFIED
- Link: <https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20001703> (200).
- Version: "Fassung vom 22.11.2026", StF BGBl. I Nr. 152/2001.
- § 5(1): "Ein Diensteanbieter hat den Nutzern ständig zumindest folgende
  Informationen leicht und unmittelbar zugänglich zur Verfügung zu stellen:
  1. seinen Namen oder seine Firma; 2. die geografische Anschrift ... 3.
  Angaben, auf Grund deren die Nutzer mit ihm rasch und unmittelbar in
  Verbindung treten können, einschließlich seiner elektronischen
  Postadresse; 4. sofern vorhanden, die Firmenbuchnummer ...".

### [MedienG] Austria - §§ 24, 25 Mediengesetz - VERIFIED
- Link: <https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10000719> (200).
- Version: "Fassung vom 22.11.2026" (last change BGBl. I Nr. 21/2026).
- § 24 is the **Impressum** ("Auf jedem Medienwerk sind der Name oder die
  Firma des Medieninhabers ... anzugeben"); § 25 is the **Offenlegung**
  (disclosure): "Auf einer Website sind diese Angaben ständig leicht und
  unmittelbar auffindbar zur Verfügung zu stellen"; § 25(5) reduced duty
  (name, Unternehmensgegenstand, Wohnort/Sitz) for sites without
  opinion-forming content; § 25(1) allows combining with the § 5 ECG data.
  (The report's earlier "§ 25 MedienG" for the imprint was imprecise: the
  imprint is § 24, the website disclosure is § 25.)

### [UKECR6] United Kingdom - Electronic Commerce (EC Directive) Regulations 2002, reg. 6 - VERIFIED
- Link: <https://www.legislation.gov.uk/uksi/2002/2013/regulation/6> (200),
  "Latest available (Revised)".
- Reg. 6(1): information "easily, directly and permanently accessible ...
  (a) the name of the service provider; (b) the geographic address".

### [PECR6] United Kingdom - PECR 2003, reg. 6 - VERIFIED
- Link: <https://www.legislation.gov.uk/uksi/2003/2426/regulation/6> (200).
- Reg. 6 **substituted on 5 February 2026** by the Data (Use and Access) Act
  2025 (c. 18) s. 112(2); now "Subject to Schedule A1, a person must not
  store information, or gain access to information stored, in the terminal
  equipment". Exceptions are in the new Schedule A1 (not re-read here).

### Other imprint equivalents - UNVERIFIED
- France (LCEN, loi n° 2004-575, mentions légales), Switzerland (UWG Art. 3
  Abs. 1 lit. s), Netherlands (BW 3:15d), Luxembourg, Finland: not fetched -
  the Pandex daily quota ran out before these lookups. They are the national
  transpositions of [ECD] Art. 5 (CH: not an EU state, own rule), so the
  data set (name, address, e-mail, register number, VAT ID) is the same core.

### [UKGDPR] UK GDPR - partly verified
- Link: <https://www.legislation.gov.uk/eur/2016/679/contents> (200). The UK
  GDPR is amended by the Data (Use and Access) Act 2025 (confirmed for PECR
  above); individual UK GDPR articles were **not** re-read - UNVERIFIED at
  article level. The report's GDPR article numbers are the EU text.

---

## United States

### [HIPAA] 45 CFR Part 164 - VERIFIED
- Link: <https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164> (200);
  section links `.../subpart-C/section-164.308`, `-164.312`, `-164.316`,
  `.../subpart-D`, `.../subpart-E/section-164.504`, `-164.524`, `-164.526`
  (all 200). Text read through the eCFR versioner API, eCFR "up to date as
  of 2026-11-19".
- Security Rule (§§ 164.302-318) unchanged since 78 FR 5694 (25 Jan 2013).
  The **Security Rule NPRM** "HIPAA Security Rule To Strengthen the
  Cybersecurity of ePHI" (90 FR, 2025-01-06, doc. 2024-30983,
  <https://www.federalregister.gov/documents/2025/01/06/2024-30983/hipaa-security-rule-to-strengthen-the-cybersecurity-of-electronic-protected-health-information>, 200)
  is still only a **Proposed Rule** - nothing in it applies.
- **New Privacy Rule final rule** 91 FR 74848, published 2026-11-19, "The
  final rule is effective on January 19, 2027" (doc. 2026-23429,
  <https://www.federalregister.gov/documents/2026/11/19/2026-23429/hipaa-privacy-rule-changes-to-support-coordinated-care-and-individual-engagement-and-reduce>, 200).
  It amends §§ 164.501-164.532 including § 164.524 (access).
- Quotes (§ 164.312): (a)(1) access control; (a)(2)(i) "Unique user
  identification (Required). Assign a unique name and/or number";
  (a)(2)(ii) "Emergency access procedure (Required)"; (a)(2)(iii)
  "Automatic logoff (Addressable). Implement electronic procedures that
  terminate an electronic session after a predetermined time of inactivity";
  (a)(2)(iv) "Encryption and decryption (Addressable)"; (b) "Audit controls.
  Implement hardware, software, and/or procedural mechanisms that record and
  examine activity"; (c)(1) "Integrity ... protect ePHI from improper
  alteration or destruction"; (d) "Person or entity authentication" (does
  **not** prescribe MFA); (e)(1) "Transmission security".
- § 164.308: (a)(1)(ii)(D) "Information system activity review (Required)
  ... audit logs, access reports"; (a)(3)(ii)(B) "Workforce clearance
  procedure"; (a)(4) information access management; (a)(7)(ii)(A)/(B) data
  backup plan / disaster recovery plan (Required).
- § 164.316(b)(2)(i): "Retain the documentation required by paragraph (b)(1)
  ... for 6 years from the date of its creation or the date when it last was
  in effect". (b)(1) covers written policies/procedures and records of an
  "action, activity or assessment" the subpart requires to be documented -
  it does **not** literally say "keep audit logs 6 years".
- §§ 164.400-414 breach notification; § 164.504(e) business associate
  contracts; § 164.524 access; § 164.526 amendment.

### [CCPA] Cal. Civ. Code § 1798.100 et seq. - VERIFIED (via CPPA)
- Official statute host leginfo.legislature.ca.gov answers **403**
  (Cloudflare "Just a moment...") to non-browser clients. Text read from the
  California Privacy Protection Agency: <https://cppa.ca.gov/pdf/20260101_ccpa_statute.pdf>
  (200), "effective 01/01/2026 – AB 137, AB 566 update". Regulations: 11 CCR
  § 7000 et seq., <https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf>
  (200; despite the file name, "CCPA Regulations ... Effective 1/1/2026").
- § 1798.100(a): "at or before the point of collection, inform consumers".
- § 1798.105(a): "the right to request that a business delete any personal
  information about the consumer".
- § 1798.106(a) correct; § 1798.110(a) know/access.
- § 1798.135(a)(1): link "Do Not Sell or Share My Personal Information".
- § 1798.140(d) "Business" means a for-profit entity meeting a threshold
  ("annual gross revenues in excess of twenty-five million dollars ... as
  adjusted", 100,000 consumers, ...) - many WeKan operators are not
  "businesses".
- ADMT: 11 CCR § 7200(b): "A business that uses ADMT for a significant
  decision prior to January 1, 2027, must be in compliance ... no later than
  January 1, 2027." Cybersecurity audits § 7120-7121 phased from 2028.

### [COPPA] 16 CFR Part 312 - VERIFIED (definition only)
- <https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312> (200);
  § 312.2 "Child means an individual under the age of 13." The 2025 COPPA
  amendments' compliance date was not checked - UNVERIFIED.

### [EO14028] Executive Order 14028 - checked, not applicable
- <https://www.federalregister.gov/documents/2021/05/17/2021-10460/improving-the-nations-cybersecurity> (200).
  It directs US federal agencies and their software suppliers; it is not a
  legal duty for WeKan. Kept only as SBOM good-practice context.

### [NIST63B] NIST SP 800-63B-4 - VERIFIED (guidance, not law)
- <https://pages.nist.gov/800-63-4/sp800-63b.html> (200): "Verifiers and CSPs
  SHALL require passwords that are used as a single-factor authentication
  mechanism to be a minimum of 15 characters in length."

---

## Other jurisdictions

### [LGPD] Brazil - Lei nº 13.709/2018 - VERIFIED
- <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm>
  (200, but slow: needed > 60 s and HTTP/1.1; a 60 s check returned 000).
  Compiled version (texto compilado).
- Art. 65: in force "24 (vinte e quatro) meses após a data de sua
  publicação" for most articles; sanctions (arts. 52-54) "1º de agosto de
  2021".
- Art. 8 consent "por escrito ou por outro meio que demonstre a manifestação
  de vontade"; Art. 9 access to information on processing; Art. 11 sensitive
  data; Art. 18 data-subject rights; Art. 33 international transfer; Art. 37
  "manter registro das operações de tratamento"; Art. 41 "indicar
  encarregado"; Art. 46 security measures; Art. 48 "comunicar à autoridade
  nacional e ao titular a ocorrência de incidente de segurança".

### [PIPEDA] Canada - S.C. 2000, c. 5 - VERIFIED
- <https://laws-lois.justice.gc.ca/eng/acts/P-8.6/FullText.html> (200); "Act
  current to 2026-10-29 and last amended on 2025-03-04".
- Sch. 1 Principle 4.1 "shall designate an individual or individuals who are
  accountable"; 4.3 consent; 4.5.3 "no longer required ... should be
  destroyed, erased, or made anonymous"; 4.8 openness; 4.9 "shall be given
  access"; s. 10.1(1) report breaches creating "a real risk of significant
  harm".

### [AUPA] Australia - Privacy Act 1988 - VERIFIED
- <https://www.legislation.gov.au/C2004A03712/latest/text> (200); compilation
  **C2026C00227 (No. 104), 4 June 2026**.
- Sch. 1 APP 1 (open and transparent management), APP 5.1 ("At or before the
  time ... collects ... must take such steps"), APP 8 cross-border, APP 11.1
  protect "from unauthorised access, modification or disclosure", APP 11.2
  destroy or de-identify, APP 12.1 access; Part IIIC notifiable data
  breaches (s. 26WE "eligible data breach", s. 26WK statement); s. 6D small
  business "annual turnover ... $3,000,000 or less" is generally exempt.
- Automated-decision transparency added to APP 1 by the 2024 amendment Act
  is not in this compilation (not yet commenced) - its start date is
  UNVERIFIED.

### [PIPL] China - 中华人民共和国个人信息保护法 - VERIFIED (Chinese text)
- <http://www.npc.gov.cn/npc/c2/c30834/202108/t20210820_313088.html> (200,
  NPC official; there is no official English text).
- 第七十四条 "本法自2021年11月1日起施行" (in force 1 Nov 2021).
- Art. 14 consent; Art. 17 notice before processing; Art. 31 under-14s need
  parental consent; Art. 38 cross-border conditions; Art. 47 deletion;
  Art. 51 security and classification measures; Art. 52 person in charge of
  PI protection; Art. 54 "定期 ... 进行合规审计" (**compliance audits**, not
  records of processing); Art. 55-56 impact assessment; Art. 57 breach
  remedial measures and notification.

### [DPDP] India - Digital Personal Data Protection Act, 2023 (No. 22 of 2023) - VERIFIED text, UNVERIFIED dates
- <https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf> (200).
- s. 1(2): commences on dates notified, "different dates may be appointed".
  s. 2(f) child = under 18; s. 5 notice; s. 6(1) consent "free, specific,
  informed, unconditional and unambiguous"; s. 8(5) security safeguards;
  s. 8(6) breach intimation; s. 8(7) erasure; s. 9(1) verifiable parental
  consent; s. 11-12 access, correction, erasure; s. 16 transfer restrictions.
- Commencement: the DPDP Rules, 2025 and commencement notifications of
  13 Nov 2025 are reported (secondary sources only) to bring the core duties
  into force on 13 May 2027. MeitY's page is a JavaScript application that
  returned no text, so the dates are **UNVERIFIED**.

### [APPI] Japan - Act on the Protection of Personal Information (Act No. 57 of 2003) - VERIFIED (translation)
- English: <https://www.japaneselawtranslation.go.jp/en/laws/view/4241/en> (200),
  "Last Version: Act No. 37 of 2021" - Japanese Law Translation is an
  official government service but the translation is **not** authoritative;
  Japanese text <https://laws.e-gov.go.jp/law/415AC0000000057> (200, a
  JavaScript page; not read).
- Art. 2(3) "sensitive personal information" incl. medical history; Art. 21
  notify purpose of use; Art. 23 security measures; Art. 26 report leaks;
  Art. 33 disclosure; Art. 35 cease use / delete.

### [POPIA] South Africa - Protection of Personal Information Act 4 of 2013 - VERIFIED (as enacted)
- <https://www.gov.za/sites/default/files/gcis_document/201409/3706726-11act4of2013popi.pdf>
  (200; Government Gazette text as enacted - no consolidation found).
- s. 11(1) processing grounds (consent "or a competent person where the data
  subject is a child"); s. 14(1) retention "no longer than is necessary";
  s. 18(1) notification on collection; s. 19(1) security measures; s. 22(1)
  notify the Regulator and the data subject of compromises; s. 23 access;
  s. 26 special personal information; s. 55 Information Officer duties.
- Commencement (1 July 2020, grace to 30 June 2021) is UNVERIFIED (the
  commencement proclamation was not read).

---

## Standards and frameworks

### [WCAG22] WCAG 2.2 - VERIFIED
- <https://www.w3.org/TR/WCAG22/> (200): "W3C Recommendation 12 December 2024".
- New AA criteria read: 2.4.11 Focus Not Obscured (Minimum) "not entirely
  hidden"; 2.5.7 Dragging Movements; 2.5.8 Target Size (Minimum) "at least
  24 by 24 CSS pixels"; 3.2.6 Consistent Help (A); 3.3.7 Redundant Entry
  (A); 3.3.8 Accessible Authentication (Minimum); 4.1.1 Parsing "Obsolete
  and removed". Not a law by itself - it becomes binding through EN 301 549
  / national law.

### [ISO27001] ISO/IEC 27001:2022 - UNVERIFIED
- <https://www.iso.org/standard/27001> answered **403** (bot protection), also
  via WebFetch. The standard is paywalled; Annex A control numbers in the
  report (A.5.7, A.5.9, A.5.15-A.5.18, A.5.34, A.8.2, A.8.5, A.8.8, A.8.9,
  A.8.13, A.8.15-A.8.17, A.8.24) could not be checked against an official
  text and whether Amendment 1:2024 is current could not be confirmed.

### [ISO27701] ISO/IEC 27701 - UNVERIFIED
- <https://www.iso.org/standard/27701> answered **403**. The report's clause
  "7.2.8" is the numbering of ISO/IEC 27701:2019; whether a newer edition
  with different numbering is current could not be confirmed.

### [SOC2] AICPA Trust Services Criteria (2017, revised points of focus 2022) - UNVERIFIED
- <https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022>
  (200) is a download page behind an AICPA account; the criteria text (CC6.x,
  CC7.x, CC8.1, A1.2, C1.2, PI1) was not readable. SOC 2 is an attestation
  framework, not law.

### [RFC9116] RFC 9116 security.txt - VERIFIED (not law)
- <https://www.rfc-editor.org/rfc/rfc9116.html> (200): file at
  `/.well-known/security.txt`; "Contact" one or more required; "Expires"
  "MUST always be present and MUST NOT appear more than once".

---

## Link check result (2026-11-22)

| HTTP | Links |
|---|---|
| 200 | gesetze-im-internet.de (DDG § 5, TDDDG § 25, BSIG 2025 § 30, § 32), ris.bka.gv.at (ECG, MedienG), legislation.gov.uk (3), ecfr.gov (9), federalregister.gov (3), cppa.ca.gov (2), laws-lois.justice.gc.ca, legislation.gov.au, npc.gov.cn, meity.gov.in PDF, japaneselawtranslation.go.jp, laws.e-gov.go.jp, gov.za PDF, w3.org, etsi.org, aicpa-cima.com (gated page), pages.nist.gov, rfc-editor.org |
| 200 (slow) | planalto.gov.br (needs > 60 s, HTTP/1.1) |
| 202 | all eur-lex.europa.eu and data.europa.eu/eli links (AWS WAF challenge, valid in a browser; text verified via Pandex/Cellar) |
| 403 | leginfo.legislature.ca.gov (Cloudflare challenge), iso.org (2) |
