# Ehdotettujen korjausten tarkastus

Tarkastus tehtiin 19.9.2026 WeKanin commitin
`2dbf9c7f391969de72d988c2ea4460a34a25915e` perusteella.

[Fixes.md](Fixes.md) sisältää ehdotuksia, ei toteutettuja korjauksia. Kaikkien 78
muutoslohkon alkuperäistä koodia kuvaavat osat vastaavat edelleen niiden 35
lähdetiedoston nykyistä sisältöä. Tässä tarkastuksessa arvioidaan kaikki 36
havaintoa, erotetaan hyödylliset muutokset keskeneräisistä korjausehdotuksista ja
kirjataan, mitä todella testattiin. Sovelluksen lähdekoodia ei muutettu.

**Useimmat havainnot osoittavat hyödyllisiä parannuksia. Raporttia ei pidä ottaa
käyttöön yhtenä valmiina korjauspakettina.** V07 sisältää virheellisen valitsimen
ja muuttaa asiaan liittymättömän työpöytänäkymän tyylisäännön soveltamisalaa.
F02, F03/F04, F06, F07, A02 ja käännösmuutokset tarvitsevat lisää toteutusta tai
testikattavuutta. A05 muuttaa tarkoituksellista tuoteratkaisua, joka on erikseen
varmistettu testillä. Nykyisten testien läpäisy ei osoita, että ehdotetut
korjaukset toimivat: myös nykyinen korjaamaton sovellus läpäisee nämä testit.

## Menetelmä ja testitulokset

Tarkastuksessa noudatettiin juurihakemiston [AGENTS.md](../../../AGENTS.md)-ohjeita,
[build.sh](../../../build.sh)-tiedoston asiaankuuluvia testaus- ja
käännöstoimintoja sekä [hiekkalaatikon ohjeita](../Sandboxes/vscodium/README.md).
Erityisesti:

- Luettiin varsinainen lähdekoodi, mukaan lukien kutsujat, näkymäpohjat,
  tietomallien muutostoiminnot, yleiset saavutettavuusmuunnokset ja nykyiset
  testit. Raportin väitteitä ei sellaisenaan pidetty todisteina. Generoidut
  `_build`-, `.build`- ja `.tools`-kopiot jätettiin lähdekoodin arvioinnin ulkopuolelle.
- Käytettiin repositorion paikallista Node-versiota **v24.21.0**, joka vastaa
  `Dockerfile`-tiedostoa, Linuxin aarch64-ympäristössä. Meteor ilmoitti versioksi
  **3.6-beta.0**, joka vastaa `.meteor/release`-tiedostoa.
- Väliaikaistiedostot tallennettiin `.tools/tmp`-hakemistoon. Tarkastusta varten
  käytettiin erillistä tietokantaa ja tallennushakemistoa. Sovelluspaketti
  käännettiin uudelleen Meteorin `build --directory --verbose` -komennolla.
  Palvelin käynnistettiin Meteorin mukana toimitetuilla Nodella ja MongoDB:llä
  `build.sh`-testityönkulun tapaan. Tuloshakemisto oli tarkastuskohtainen, joten
  olemassa olevaa `.build`-pakettia ei korvattu. Koko
  `build.sh --run-everything` -työnkulkua tai siihen kuuluvaa riippuvuuksien
  puhdasta uudelleenasennusta ei suoritettu.
- Ajettiin repositorion kaikki tavallisella Nodella suoritettavat testisarjat:
  **1 173 testisarjaa, ei yhtään epäonnistumista**, 154 sekuntia. Luku tarkoittaa
  testisarjojen, ei yksittäisten tarkistusväitteiden määrää.
- Ajettiin kolme olemassa olevaa koko sovelluksen Playwright-testitapausta
  **Chromiumissa ja Firefoxissa: kuusi hyväksyttyä suoritusta**. Ne testaavat
  liitteiden esikatselun rakennetta, tarkistuslistan kohdan merkitsemistä
  valmiiksi sekä ponnahdusikkunan nimeämistä ja näppäimistökohdistuksen
  rajaamista ikkunaan. Nämä ovat lähtötilanteen tarkistuksia, eivät kaikkien
  36 havainnon regressiotestejä.
- Ajettiin kummassakin selaimessa kaksi tarkastusta varten tehtyä lisätestiä
  vastakäännettyä sovellusta vasten: **neljä erillistä testitapauksen ja selaimen
  yhdistelmää läpäisi testit**. Ne toistavat V01:n, V05:n ja A07:n, tarkistavat
  A09:n kohdistettavuuden sekä F17:n katselukomponentin olemassaolon. CSS ja
  A07:n tapahtumankäsittelijä lisättiin testisivulle ehdotetun toiminnan
  vertailemiseksi. Tämä ei vastaa käännetyn ja sovellukseen integroidun
  korjauksen testausta. F17 ajettiin uudelleen molemmissa selaimissa oikealla
  `#viewer-overlay`-valitsimella ja positiivisella vertailutarkistuksella, joka
  varmisti yhden katselukomponentin syntyvän kortin avaamisen yhteydessä.
- Tehtiin kahdeksalle havainnolle eristetyt selainvertailut ennen ehdotettuja
  muutoksia ja niiden jälkeen molemmissa selaimissa: **32 havaintoa**. Näissä
  käytettiin lähdekoodin CSS:ää, pikanäppäinsuodatinta tai pieniä edustavia
  DOM-testirakenteita. Ne eivät testaa Meteorin tietotilauksia tai tietojen
  pysyvää tallentumista.
- Suoritettiin eristettyjä lähdekoodiin perustuvia tarkistusväitteitä F03:lle,
  F06:lle, F08:lle ja F10:lle. Varmistettiin T01:n puuttuvien avainten määrä ja
  A04:n kontrastilaskelma. Ehdotettu JavaScript läpäisi `node --check`
  -tarkistuksen ja ehdotettu JSON jäsentyi onnistuneesti. Ehdotettuja
  Jade-näkymäpohjia ei väitetä käännetyiksi eikä kaikkia ehdotettuja tyylitiedostoja
  oikeiksi.
- WebKitin vastaava selainversio ladattiin, mutta ympäristön riippuvuustarkistus
  ilmoitti puuttuvista järjestelmäkirjastoista. **WebKitin sovellustestejä ei
  ajettu.** Ohitettua selainprojektia ei lasketa hyväksytyksi suoritukseksi.

Sovelluksen uusi käännös valmistui onnistuneesti. Se tuotti riippuvuusvaroituksia
ja inotify-tiedostoseurannan virheitä (`No space left on device`). Tuloksena
syntynyt palvelin kuitenkin käynnistyi ja palveli selaintestejä.
Käännösvaroitukset eivät osoita ehdotetun korjauksen toimivuutta tai virheellisyyttä.

FerretDB:n integraatio- tai yhteensopivuustestejä, Meteor Mocha -testejä, koko
selaintestisarjaa, ruudunlukijatestausta tai kaikkien kieli-, mobiili- ja
teemayhdistelmien testausta ei tehty. Sovellustarkistusten tietokantana oli
MongoDB. Havainnot koskevat pääasiassa selainpuolen virheitä, eikä tämä tarkastus
varmenna toimintaa eri tietokantatoteutuksilla.

### Selaimissa havaitut erot

Alla olevat tulokset olivat samat Chromiumissa ja Firefoxissa. ”Ehdotettu muutos”
tarkoittaa testisivulle tehtyä muutosta, ei sovelluksen committia.

| Havainto | Nykyinen toiminta | Ehdotetun muutoksen jälkeen | Todentamisen laajuus |
| --- | --- | --- | --- |
| V01 | Fonttikoon ollessa 150 % otsikkotekstin korkeus 59 px ylittää 42 px korkean otsakealueen. | Otsakealueen korkeudeksi tulee 62,5 px, jolloin teksti mahtuu. | Vastakäännetyn sovelluksen ponnahdusikkuna ja eristetty CSS. |
| V05 | Kun edistyminen on 100 %, sovelluksen 384 px leveän palkkipohjan täyttö on 416 px leveä. | Täytön leveydeksi tulee 384 px. | Vastakäännetyn sovelluksen tarkistuslista. Eristetyssä 200 px leveässä palkissa täyttö muuttui vastaavasti 232 px:stä 200 px:iin. |
| V03 | Oikealta vasemmalle luettavan näkymän tietolohko varaa vasemmalle 64 px ja oikealle 0 px. | Vasemmalle varataan 0 px ja oikealle 64 px. | Eristetty lähdekoodin CSS. |
| V07 | Leveyden ollessa 320 px ruudukkoon jää kaksi 151 px saraketta. | Ensimmäinen ehdotettu mediasääntö tuottaa yhden 320 px sarakkeen. | Eristetty CSS; tämä **ei** varmista myöhemmän virheellisen muutoslohkon oikeellisuutta. |
| A01 | Lähdekoodin pikanäppäinsuodatin sallii välilyönnin kohdistetusta painikkeesta. | Suodatin estää painikkeen; se estää edelleen syötekentän ja sallii tavallisen elementin. | Lähdekoodin suodatinta suoritettiin oikeissa selaimissa. |
| A05 | Sarkainnäppäin ohittaa testirakenteen salasanan näyttöpainikkeen. | Sarkainnäppäimellä pääsee painikkeeseen. | Edustava selaimen omaa painike-elementtiä käyttävä testirakenne. |
| A07 | Välilyönti ei merkitse valmiiksi sovelluksen kohdistettua tarkistuslistan riviä. | Testisivulle lisätty ehdotettu käsittelijä merkitsee kohdan valmiiksi nykyisen napsautuskäsittelijän kautta. | Vastakäännetty sovellus ja oikea tarkistuslistan muutostoiminto. |
| A09 | Kytkimellä on `display:none` ja `visibility:hidden`; sarkainnäppäin ohittaa sen testirakenteessa. | Lähdekoodin CSS:n korvaava sääntö tekee varsinaisesta syöte-elementistä kohdistettavan. | Sovelluksen kohdistustarkistus ja eristetty sarkainnavigointi. |
| F16 | Toisen selitteen napsautus valitsee ensimmäisen syöte-elementin, kun tunnisteet ovat samat. | Yksilölliset tunnisteet ohjaavat valinnan toiseen syöte-elementtiin. | Tavallinen DOM-testirakenne; usean kortin tietojen pysyvää tallentumista ei testattu. |
| F17 | Taululla, jolla ei ole avointa korttia, on nolla `#viewer-overlay`-elementtiä. | Katselukomponentin yleistä sijoitusmuutosta ei lisätty testisivulle. Kortin avaaminen toimii positiivisena vertailuna ja tuottaa yhden katselukomponentin. | Vastakäännetty sovellus; historian diaesitys ja usean kortin aiheuttama monistuminen on todennettu vain lähdekoodista. |

## Havainnot: hyödyllisyys ja jäljellä oleva työ

”Hyödyllinen” tarkoittaa alla esitetyn näytön tukemaa suositusta, ei väitettä
kattavasta ajonaikaisesta varmistuksesta. Jokainen rivi tarkistettiin lähdekoodista.
Mahdollinen lisänäyttö suoritetuista testeistä mainitaan erikseen.

### Toiminnalliset havainnot

| Tunnus | Lähdekoodin arvio ja hyödyllisyys | Jäljellä oleva varmistus tai korjaus |
| --- | --- | --- |
| F01 | **Hyödyllinen.** `checklistActions.js` välittää kaksi syöte-elementtiä, mutta `server/rulesHelper.js` hakee niiden arvoilla tarkistuslistan ja kohdan otsikoita. `.value` antaa suorittajan odottamat merkkijonot sekä valmiiksi merkitsemiseen että merkinnän poistamiseen. | Testaa säännön luonti, tallennettu sisältö ja suoritus kummallekin toiminnolle. Säilytä negatiivinen testitapaus puuttuvalle otsikolle. Sääntöjen käyttöliittymätoimintoja ei suoritettu tässä tarkastuksessa. |
| F02 | **Hyödyllinen suunta; järjestämisen toimintaperiaate on keskeneräinen.** Kaikki viisi valintaikkunan toimintopolkua käyttävät edelleen vakiosiirtymiä. Kun viereisten korttien järjestysarvot ovat 0 ja 0,25, sijoittaminen arvon 0,25 yläpuolelle tuottaa arvon −0,25 eli tarkoitetun välin ulkopuolelle. Ehdotettu keskipiste on 0,125. Joukkokopioinnin sijoituskohdan päivittäminen korjaa kohteen alapuolelle lisättävien korttien käänteistä järjestystä. | Uudesta valitsimesta puuttuu `deletedAt:null`, vaikka mukaan pitäisi ottaa vain poistamattomat kortit. Tiukat vertailut eivät ratkaise samoja järjestysarvoja. Testaa saman listan sisäiset siirrot, samat järjestysarvot, poistetut ja arkistoidut naapurit, puuttuvat kohteet sekä useat kopiot molempiin suuntiin. Järjestystä ei testattu käynnissä olevassa sovelluksessa. |
| F03 | **Hyödyllinen.** Molemmat valintaikkunaluokat asettavat valitun taulun tietotilauksen valmistumiskäsittelijässä. Kantaluokan suoritus hallituilla takaisinkutsuilla toisti tilanteen, jossa valintasarja A→B→C päättyy B:hen, kun B valmistuu viimeisenä. Ehdotettu versio tallentaa C:n heti ja säilyttää sen myös takaisinkutsujen valmistuessa käänteisessä järjestyksessä. | Yhdistä F04:ään ja testaa kortinvalitsimen aliluokka, nopeat paluut samalle taululle, lähetys latauksen aikana sekä tietotilauksen epäonnistuminen. Testissä ohjataan takaisinkutsuja; kyseessä ei ole DDP-ajoitustesti. |
| F04 | **Hyödyllinen.** Konstruktori sitoo `boardDestinations`-tilauksen näkymäpohjaan `tpl.subscribe`-kutsulla, mutta molemmat `getBoardData`-toteutukset käyttävät näkymäpohjaan sitomatonta `Meteor.subscribe`-kutsua. Edellisen tilauskahvan säilyttäminen ja pysäyttäminen sekä näkymäpohjan omistamien tilausten käyttö korjaavat elinkaarien eroa. | F03 ja F04 muuttavat samoja alkuperäisiä koodilohkoja ja tarvitsevat yhteisen toteutuksen. Varmista tilausten vapautuminen suljettaessa sekä vanhentuneet takaisinkutsut tilausta vaihdettaessa. Tilausten määrää ei mitattu. |
| F05 | **Hyödyllinen.** Yhteinen Valmis-toiminnon käsittelijä ottaa virheen kiinni mutta kutsuu sen jälkeen aina `Popup.back(2)`. Paluu virheenkäsittelylohkosta säilyttää lomakkeen. | Testaa hylätyt siirto-, kopiointi- ja linkitystoiminnot, virheellinen JSON sekä onnistuneen toiminnon sulkeutuminen tasan kerran. Estävä `alert` on vähimmäisratkaisu; lokalisoitu virheilmoitus lomakkeessa säilyttäisi asiayhteyden selkeämmin. |
| F06 | **Todellinen virhe; hyödyllinen mutta raskas ehdotus.** `moveCardBy` vaihtaa keskenään samat järjestysarvot, jolloin `computeCardMoveModifier` tulkitsee siirrot muutoksettomiksi. Lähdekoodin suoritus toisti tilanteen, jossa `[0,0]` säilyy ennallaan. Ehdotettu silmukka tuotti `[1,0]`. | Kaikkien saman listan korttien uudelleennumerointi vaatii yhdelle siirrolle enimmillään N peräkkäistä kirjoitusta ja voi keskeytyä puolivälissä virheeseen. Säilytä kevyt toteutus tavallisille tapauksille, käsittele hylätyt siirrot kutsujissa ja testaa oikeudet, samanaikaisuus sekä poistetut naapurikortit. Tietokantaan tallentuvaa uudelleenjärjestämistä ei testattu. |
| F07 | **Hyödyllinen mutta keskeneräinen.** `moveListBy` valitsee naapurit koko taululta, kun taas `swimlane.myLists()` valitsee nykyisen uimaradan ja jaetut listat. Ehdotettu uimaratasuodatin yhtenäistää tämän rajauksen. | Lisää myös näkymän käyttämä `deletedAt:null`; muuten poistettu lista voi edelleen päätyä näkymättömäksi naapuriksi. Testaa jaetut listat, muut kuin uimaratanäkymät, rajakohdat ja samat järjestysarvot. |
| F08 | **Hyödyllinen.** Kääretoiminto tallentaa `preservedViewType`-arvon mutta sivuuttaa sen aina, kun `options.initialView` on olemassa. Taulu asettaa tämän vaihtoehdon. Ehtolauseen suoritus säilytti ennen korjausta kuukausinäkymän ja korjauksen jälkeen viikkonäkymän. | Testaa todelliset kieli- ja viikon aloituspäivän muutokset sekä päivämäärän säilyminen. Päätä erikseen, miten tarkoituksellisen ulkoisen näkymänvaihtopyynnön pitäisi toimia, sillä ehdoton säilyttäminen ohittaa sen. |
| F09 | **Hyödyllinen.** Uuden käännöksen lähetys kutsuu `Popup.back()` heti ja uudelleen onnistuneen valmistumisen jälkeen. Välittömän kutsun poistaminen pitää päällekkäisyysvirheen näyttökohteen olemassa ja estää kaksinkertaisen paluun. | Testaa selaimessa viivästynyt onnistuminen, päällekkäisyyden tarkistus ja muut palvelinvirheet. Ehdotettu korjaus ei lisää palautetta kaikille muille virheille. |
| F10 | **Hyödyllinen kirjaimellisessa haussa.** Nykyinen lähdekoodi tuottaa `SyntaxError`-virheen syötteestä `[`. Ehdotettu erikoismerkkien suojaus sallii `[`-merkin haun. Myös tavallinen `abc`-haku toimii edelleen eristetyssä tarkistuksessa. | Testaa Enterillä käynnistyvät käyttöliittymäpäivitykset, tyhjä haku, kenoviivat ja välimerkit. Jos säännöllisiin lausekkeisiin perustuva haku on tarkoituksellinen ominaisuus, dokumentoi toimintaperiaate sen sijaan, että muuttaisit sitä huomaamatta. |
| F11 | **Hyödyllinen.** Molemmat numeropikanäppäinten käsittelijät lukevat `board.labels`-arvon ennen taulun olemassaolon tarkistamista. Taulun olemassaolotarkistus kuuluu kumpaankin paikkaan. | Testaa selaimessa numerot ja Vaihto+numero taulun ulkopuolella pikanäppäinten ollessa käytössä sekä toimivat tunnistepikanäppäimet taululla. Nykyiset selaintestien asetukset poistavat käyttäjän pikanäppäimet oletusarvoisesti käytöstä. |
| F12 | **Hyödyllinen.** Ylityön napsautuskäsittelijä tallentaa muutoksen heti, vaikka myös lomakkeen lähetyskäsittelijä tallentaa ylityötiedon. Ehdotettu paikallinen DOM-muutos poistaa ennenaikaisen tallentumisen. Sen alielementtivalitsin vastaa `cardTime.jade`-rakennetta. | Varmista, että Peruuta jättää tiedot ennalleen, Tallenna tallentaa ne ja reaktiiviset päivitykset eivät hävitä luonnosta. Näkymäpohjakohtainen reaktiivinen luonnos ja rajattu haku lähetyksen yhteydessä olisivat luotettavampia kuin yleiset `#overtime`-haut. |
| F13 | **Hyödyllinen.** Korttivaihtoehdon apufunktio vertaa tallennettua `cardOption.cardId`-arvoa, mutta muutostapahtumat päivittävät `selectedCardId`-arvoa. Konstruktori alustaa tämän reaktiivisen arvon tyhjäksi `super`-kutsun jälkeen, vaikka tallennettuja valintoja voi jo olla. | Testaa palautetut oletusvalinnat, taulun tai listan vaihto, valitun kortin poistuminen ja vaihtoehtojen reaktiivinen päivitys. Ehdotettua apufunktion ja konstruktorin yhtenäistämistä tukee lähdekoodi, ei mitattu Blazen näkymäpäivityksen tulos. |
| F14 | **Hyödyllinen harhaanjohtavien säätimien poistona.** Neljän rivin asetukset ovat `cardSettingsRows.js`-tiedostossa, mutta pienoiskortin näkymäpohja ja apufunktiot eivät käytä niitä. Liitemäärällä ja kansikuvalla on omat näkymänsä ja asetuksensa; ne eivät toteuta näitä neljää säädintä. | Valitse tietoisesti joko poistaminen tai varsinaisen esityksen toteutus. Päivitä rivikattavuuden testiodotukset, säilytä tallennettujen arvojen yhteensopivuus ja tarkista korttiasetusten molemmat puolet. Tämä ei oikeuta poistamaan toimivia korttipuolen rivejä. |
| F15 | **Hyödyllinen.** Moduulitason URL asetetaan vain hiiren siirtyessä elementin päälle, minkä jälkeen taustakuvan lisäystoiminto käyttää sitä. `isBackgroundImage` palauttaa aina arvon false. Nykyisen liitteen selvittäminen olemassa olevalla `getAttachmentUrl`-apufunktiolla korjaa molemmat lähdekoodin virheet. | Testaa avaaminen näppäimistöllä ja kosketuksella ilman hiiren osoitusta, liitteen vaihtaminen, rikkinäiset ja poistetut liitteet sekä lisäämistä seuraava poistaminen. Taustakuvaa muuttavaa toimintoa ei suoritettu tässä tarkastuksessa. |
| F16 | **Hyödyllinen.** Jokainen avoin kortti käyttää samaa valintaruudun tunnistetta ja selitteen kohdetta. Selaintestit toistivat väärän syöte-elementin aktivoitumisen ja osoittivat yksilöllisten tunnisteiden korjaavan sen. Delegoidun tapahtumakäsittelyn valitsin on muutettava samalla kuin rakenne, kuten ehdotuksessa tehdään. | Avaa kaksi oikeaa korttia ja varmista, että vain tarkoitettu kortti muuttuu. Toista näppäimistöllä A09:n jälkeen. Omat kortit -näkymän yleinen päällekkäisten tunnisteiden testi ei kata tätä tilannetta. |
| F17 | **Hyödyllinen.** Katselukomponentti luodaan kortin tietoihin ja ylläpidon Ongelmat-näkymään, mutta historia kutsuu `openAttachmentSlideshow`-toimintoa. Sovellustestit varmistivat, ettei katselukomponenttia ole taululla ilman avointa korttia ja että kortin avaaminen luo yhden. Siirtäminen yhteiseen oletusasetteluun korjaa elinkaarien eroa. | Testaa taulun historia ilman avoimia kortteja, kaksi avointa korttia, ylläpidon Ongelmat-näkymä, diaesityksessä siirtyminen ja siivous reittejä vaihdettaessa. Varmista siirron jälkeen täsmälleen yksi katselukomponentti eikä päällekkäisiä tapahtumakytkentöjä. |

### Ulkoasuhavainnot

| Tunnus | Lähdekoodin arvio ja hyödyllisyys | Jäljellä oleva varmistus tai korjaus |
| --- | --- | --- |
| V01 | **Hyödyllinen ja selaimessa varmennettu.** Kiinteä otsakekorkeus on ristiriidassa skaalautuvan otsikon rivikorkeuden kanssa. Lähdekoodin CSS:n lisääminen korjasi mitatun ylivuodon vastakäännetyssä sovelluksessa. | Tarkista mobiilin kiinteä otsake ja sisällön siirtymä yhdessä, kaikki fonttikokoasetukset, pitkät otsikot sekä sulkemis- ja paluupainikkeiden osuma-alueet. |
| V02 | **Hyödyllinen.** Sovelluksen mukana toimitettavan Frappen tyylitiedostossa on kiinteät tekstikoot pikseleinä. `uiFont.js` tarjoaa skaalausmuuttujan, mutta ei voi automaattisesti skaalata näitä arvoja. Ehdotetut rajatut korvaavat säännöt kohdistuvat tähän ristiriitaan. | Tarkastele kaavion selitteitä, säätimiä ja SVG-tekstiä 100 ja 150 prosentin koossa, myös pitkillä teksteillä. Suurempi teksti voi tarvita enemmän tilaa kaaviossa tai palkeissa; pelkkä CSS-fonttiskaalaus ei todista tekstin mahtuvan. |
| V03 | **Hyödyllinen ja selaimessa varmennettu kuvatun suuntaongelman osalta.** Fyysinen vasen marginaali on ristiriidassa loogisesti sijoitetun RTL-profiilikuvan kanssa. Looginen alkureunan marginaali varaa tilan oikealle puolelle. | Tarkista oikeat pienoisprofiilit molemmissa lukusuunnissa suurilla fonteilla ja ilman profiilikuvaa. |
| V04 | **Hyödyllinen.** Valmiiksi merkitsemisen säädin on ennen lohkomuotoista `.minicard-title-text`-elementtiä, mikä selittää erillisen rivin. Yhteinen flex-rivi on sopiva rakenteellinen korjaus ja säilyttää ylemmän tason polkuetuliitteet sen yläpuolella. | Käännä Jade ja testaa linkitetyt kortit ja taulut, arkistointikuvakkeet, moniriviset Markdown-otsikot, ylemmän tason etuliitteet, RTL sekä käytöstä poistettu valmiiksi merkitseminen. Ei varmennettu selaimessa tässä tarkastuksessa. |
| V05 | **Hyödyllinen ja selaimessa varmennettu.** Content-box-mallin prosenttileveys ja 32 px vaakasuuntainen sisämarginaali yhdessä liioittelevat edistymistä. Sisämarginaalin poistaminen ja border-box-määritys korjasivat sovelluksessa mitatun 100 prosentin leveyden. | Lisää regressiotestit nollalle prosentille, osittaiselle valmistumiselle ja tyhjälle tarkistuslistalle. Säilytä normaali pyöristys. Nykyinen selaintesti tarkistaa vain palkin ilmestymisen. |
| V06 | **Hyödyllinen.** Lähdekoodin flex-alielementeillä on automaattiset vähimmäiskoot, eivätkä liitteen metatiedot rivity. `min-width:0`, `overflow-wrap:anywhere` ja metatietojen rivitys helpottavat tilanpuutetta. | Testaa pitkät yhtenäiset tekstit ja tiedostonimet määräaikasäätimien ja liitetoimintojen kanssa 320 px leveydellä ja 150 prosentin fonttikoolla, myös RTL-tilassa. Tälle havainnolle ei tehty koko sovelluksen ylivuotomittauksia. |
| V07 | **Hyödyllinen tavoite; korjaus on hylättävä nykyisessä muodossaan.** Ensimmäinen responsiivinen sääntö toimii eristetyissä selaintesteissä. Myöhempi muutoslohko lisää `@media`-tekstin valitsimen sisään `.show-minicard-only`-osan jälkeen ja laajentaa `.card-field-order-column-heading`-säännön soveltamisalaa työpöydän medialohkossa. Tämä on asiaan liittymätön haittamuutos, jota mobiilin pystyasettelu ei tarvitse. | Säilytä tarkoitetut ruudukko-, vähimmäisleveys- ja rivitysmuutokset, poista virheellinen myöhempi muutoslohko ja säilytä alkuperäinen rajattu otsikkosääntö. Testaa yhdistetty ponnahdusikkuna ja molemmat yhden puolen ikkunat työpöytä- ja mobiilileveyksillä. |

V07:n jatkotarkistus selaimessa varmisti, että ehdotettu tyylitiedosto muuttaa
muuten rajaamattoman `.card-field-order-column-heading`-elementin
`grid-column:auto`-arvon muotoon `1 / -1` työpöytäleveydellä. Se **ei** osoittanut,
että nykyinen yhden puolen otsikko menettäisi sarakkeiden yli ulottuvan
leveyden; tätä koskeva alustava oletus hylättiin. Muutoslohkoa on korjattava sen
virheellisen valitsimen ja tahattomasti laajentuneen soveltamisalan vuoksi.

### Käännöshavainnot

| Tunnus | Lähdekoodin arvio ja hyödyllisyys | Jäljellä oleva varmistus tai korjaus |
| --- | --- | --- |
| T01 | **Hyödyllinen.** Kaikki 35 ehdotettua lisäystä puuttuvat nykyisestä englanninkielisestä JSON-tiedostosta, ja nimetyt kutsukohdat käyttävät näitä avaimia. Luettavien oletustekstien lisääminen on perusteltua. | Pelkät englanninkieliset lisäykset eivät täytä koko AGENTS.md:n käännöstyönkulkua. Säilytä kielitiedostojen avainjärjestys ja täytä vastaavat kääntämättömät kohdat korvaamatta oikeankielisiä ihmiskäännöksiä. Harkitse vakiintuneiden pienaakkosavainten uudelleenkäyttöä erillisten isolla alkukirjaimella kirjoitettujen muunnelmien ylläpitämisen sijaan. Oletustekstien esittämistä selaimessa ei testattu. |
| T02 | **Hyödyllinen.** `models/translation.js` rajoittaa kielitunnuksen viiteen merkkiin. Rekisteröidyt tunnukset kuten `zh-Hans` ja `wuu-Hans` ylittävät rajan. | Testaa rekisteröityjen pitkien tunnusten todellinen tallennus skeeman kautta sekä tallennus ja uudelleenavaus editorissa. Hylkää tarvittaessa virheelliset ja tukemattomat arvot. Pelkkä 35 merkin pituusraja ei varmista kielitunnuksen kelvollisuutta. Kielirekisteri käyttää valenciasta tunnusta `ca-valencia`, mutta tiedostonimessä on `ca@valencia`; näitä tunnisteita ei pidä sekoittaa. |
| T03 | **Hyödyllinen mutta osittainen.** Nimetyt käsittelijät sisältävät kovakoodattuja englanninkielisiä ilmoituksia. Käännösavaimet parantavat lokalisointia, mutta `error.reason` jää yleisissä viesteissä kääntämättä. | Viimeistä ylläpitäjää koskeva erityishaara on jo nyt saavuttamaton sitä edeltävän yleisen `not-authorized`-haaran vuoksi. Merkkijonojen korvaaminen ei korjaa tätä. Muuta tarkistusten järjestystä ja testaa molemmat viestit; täydennä kieli- ja paikkamerkkikattavuus. Tässä tarkastuksessa ei poistettu eikä anonymisoitu käyttäjätilejä. |

### Saavutettavuushavainnot

Yleinen [saavutettavuusmuunnos](../../../client/lib/accessibility.js) lisää jo
ankkurielementteihin `href="#"`-määritteen ja kopioi ankkurien ja kuvakkeiden
otsikkotekstit saavutettaviksi nimiksi. Se ei tee mielivaltaisista `div`-säätimistä
tai nimeämättömistä navigointikuvakkeista näppäimistöllä käytettäviä. Tämä ero
muuttaa A08:n rajauksen.

| Tunnus | Lähdekoodin arvio ja hyödyllisyys | Jäljellä oleva varmistus tai korjaus |
| --- | --- | --- |
| A01 | **Hyödyllinen ja selaimessa varmennettu suodattimen tasolla.** Kohdistetut painikkeet läpäisevät nykyisen yleisen pikanäppäinsuodattimen. Välilyönnin käsittelijä estää oletustoiminnon ja voi muuttaa jäsenyyttä. Ehdotettu suodatus estää painikkeen mutta säilyttää tavallisten elementtien pikanäppäimet ja syötekenttien poissulkemisen. | Testaa selaimen varsinainen painikeaktivointi, kun pikanäppäimet ovat käytössä ja kortteja valittuina, sekä sisäkkäiset kuvakekohteet ja Escape-näppäimen toiminta. Selaimen tavalliset linkit aktivoidaan Enterillä; välilyöntiä ei pidä kuvata niiden yleiseksi aktivointinäppäimeksi. |
| A02 | **Hyödyllinen malli, keskeneräinen korjaus.** Luetellut sääntösäätimet ovat napsautettavia div-elementtejä, joita yleinen ankkurimuunnos ei auta. Korjaus muuttaa vain yhden, vaikka havainto luettelee useita säätimiä. | Muuta kaikki asiaankuuluvat säätimet ja anna niille toimintokohtaiset nimet. Henkilö- ja värinvalitsimia ei pidä nimetä kaikkia ”Lisää”-nimellä. Varmista Enter ja välilyönti, tahattoman lomakelähetyksen estyminen sekä sääntökohtaiset asettelut. |
| A03 | **Hyödyllinen.** Kohdevalintojen selitteillä ei ole `for`-kytkentää eikä valintalistoilla erikseen määriteltyä nimeä. `aria-label` antaa nimet. | `aria-label` ei siirrä kohdistusta säätimeen näkyvää selitettä napsautettaessa. Käytä yksilöllisiä `id`/`for`-kytkentöjä, kun mahdollista, ja testaa nimet sekä useat valintaikkunainstanssit. Avustavilla teknologioilla ei testattu. |
| A04 | **Hyödyllinen.** Uudelleenlaskenta vahvistaa, että valkoisen kontrasti taustalla `#29a3a3` on noin **3,06:1**, kun taas taustalla `#187575` se on **5,47:1**. Lähdekoodin 11 px teksti ei ole suurikokoista tekstiä. | Testaa todellinen valittu tila tuetuissa teemoissa sekä kohdistus- ja osoitustyylit. Tämä on värien laskennallinen vertailu, ei jokaisen teeman ruudulle piirretyn kontrastin tarkastus. |
| A05 | **Hyödyllinen saavutettavuusvaihtoehto, mutta tarkoituksellisen toiminnan muutos.** Sarkainnavigointi todella ohittaa painikkeen, mutta `tests/accessibilityTabOrder.test.cjs` vaatii nimenomaisesti arvoa `-1`, jotta painike ei katkaise kenttien välistä sarkainjärjestystä. | Jos näppäimistöllä saavutettavuus otetaan käyttöön, muuta testiodotusta perusteluineen ja lisää näyttämisen ja piilottamisen näppäimistötestit. Säilytä nimet, kohdistus ja takuu siitä, ettei painike lähetä lomaketta. Nykyistä testiä ei pidä kutsua virheelliseksi vain siksi, että se on ristiriidassa ehdotuksen kanssa. |
| A06 | **Hyödyllinen.** Käytöstä poistetut nuolet ovat edelleen ankkurielementtejä, niillä on aktiivista toimintoa kuvaavat otsikot ja käsittelijä kutsuu yhä tietomallin asetusfunktiota. Ehdotettu käytöstäpoiston tarkistus estää turhan kirjoituksen, ja ARIA kertoo tilan. | Tarkista rajoilla olevat ja kiinteät rivit sekä siirrettävät rivit hiirellä ja näppäimistöllä. Säilytä nykyiset järjestämistestit. ”Kiinteä rivi tai osion raja” selittää tilannetta, mutta todellisen syyn yksilöinti olisi tarkempi. |
| A07 | **Hyödyllinen ja selaimessa varmennettu muokattaville riveille.** Lähdekoodissa on napsautuskäsittely mutta ei vastaavaa rivin näppäinpainalluskäsittelijää. Välilyönti ei tehnyt sovelluksessa mitään; testisivulle lisätty ehdotettu käsittelijä muutti kohdan tilaa varsinaisen napsautustoiminnon kautta. | Testaa myös Enter, näppäimen toisto, alielementit kuten määräaikalinkit, Worker-roolin oikeudet ja vain luku -näkymä. Selainpuolen ARIA- ja tabindex-muutokset eivät ole palvelimen käyttöoikeustarkistuksia. |
| A08 | **Hyödyllinen, kun väitettä rajataan.** Gallerian esikatselu on div ja edellinen/seuraava-toiminnot ovat kuvakkeita, joten niiden muuttaminen mahdollistaa näppäimistöllä käytön. Sulkemisankkuri saa jo href-määritteen yleisestä muunnoksesta. Sen olennainen virhe on puuttuva nimi, ei täydellinen kohdistamattomuus. | Testaa Enter-navigointi, saavutettavat nimet, kohdistuksen siirtyminen katseluun ja takaisin sekä sen pysyminen katselussa. Ankkurit toimivat linkkeinä; selaimen omat painikkeet voivat kuvata toimintoja paremmin. Tämä korjaus ei yksin toteuta täysin saavutettavaa modaalista katselukomponenttia. |
| A09 | **Hyödyllinen ja selaimessa varmennettu kohdistettavuuden osalta.** Yhteinen lomake-CSS piilottaa varsinaisen valintaruudun. Ehdotettu tarkempi sääntö pitää visuaalisesti piilotetun syöte-elementin kohdistettavana ja näyttää sen selitteessä kohdistusreunuksen. | Testaa sarkainnäppäin ja välilyönti jokaisella kytkintyypillä, tilan tallentuminen, vain luku -tilanteet ja RTL. Tarkista yhteisen `.toggle-switch`-säännön muut käyttökohteet sitä korvattaessa. Yhdistä F16:een, jotta usean kortin kohdistus toimii oikein. |

## Testikattavuus ja jatkotoimet

Nykyisten testisarjojen läpäisy antaa arvokasta näyttöä lähtötilanteesta, mutta
useiden tarkistusten rajaus on näitä havaintoja suppeampi: edistymispalkin
näkyvyys ei tarkista sen leveyttä, rivien ja skeeman kattavuus ei todista jokaisen
pienoiskortin asetuksen vaikuttavan näkymään, eikä Omat kortit -näkymän
päällekkäisten tunnisteiden tarkistus kata kahta avointa korttinäkymää. A05:lle
on lisäksi nimenomaisesti vastakkainen testiodotus. Laajenna asiaankuuluvia
testisarjoja korjauksia toteutettaessa. Älä poista merkityksellisiä nykyisiä
tarkistuksia vain saadaksesi korjauksen läpäisemään testit.

Tässä tarkastuksessa ei tehty uutta sovelluskorjausta eikä Upcoming-muutoslokimerkintää.
Väliaikaiset virheiden toistot ovat tarkastuksen koetestejä, eivät pysyviksi
rekisteröityjä regressiotestejä. Ennen hyväksytyn korjauksen julkaisemista lisää
edellä kuvatut asiaankuuluvat positiiviset, negatiiviset ja käyttöliittymätestit,
aja ne uudelleen käännettyä korjattua sovellusta vasten ja noudata AGENTS.md:n
Upcoming-osion testikattavuuden tarkastusohjetta. Pelkkään lähdekoodiin perustuvat
rivit odottavat edelleen ajonaikaista varmistusta, vaikka niiden virheet olisivat
suoraan nähtävissä koodista.

Alingsåsin palautelista on pidettävä erillään virheiden vakavuusluokkien
kokonaismääristä. Kutistusnuolten piilottaminen, uudet tiiviysasetukset, pelkän
päivämäärän näyttö, tunnisteet otsikoiden yläpuolella ja tarkistuslistojen
erilliset otsikot ovat tuotetoiveita. Lähdekoodi vahvistaa nykyiset
fonttikokoasetukset ja pakotetun päivämäärämuodon toimintaperiaatteen. Tässä
tarkastuksessa ei väitetä ehdotusten toteuttavan näitä lisätoiveita tai
varmentavan palautteeseen liittyviä ulkoisia kuvakaappauksia.

## Toistaminen ja paikallinen todistusaineisto

Suorita komennot repositorion juuresta. Selvitä työkalujen versiot nykyisistä
repositoriotiedostoista; seuraavat polut kuvaavat tämän tarkastuksen ympäristöä.

```sh
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
export PATH="$PWD/.tools/node-v24.21.0-linux-arm64/bin:$PATH"
export METEOR_WAREHOUSE_DIR="$PWD/.tools/.meteor"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/ms-playwright"
unset CHROME_DEVEL_SANDBOX
node tests/run-node-suites.cjs

# Uusi tarkastuskäännös; ajo- ja palvelinasetukset noudattavat build.sh:n run_all_tests-toimintoa.
NODE_OPTIONS=--max-old-space-size=4096 .tools/.meteor/meteor build \
  .tools/tmp/fixes-audit-20260919/build --directory --verbose
```

Tarkastuspalvelimen asetukset olivat `ROOT_URL=http://localhost:3000`, `PORT=3000`,
`MONGO_URL=mongodb://127.0.0.1:3001/meteor`, `WITH_API=true`,
`RICHER_CARD_COMMENT_EDITOR=false`,
`DEFAULT_METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling` sekä absoluuttinen
`WRITABLE_PATH`, jonka loppuosa oli `.tools/tmp/fixes-audit-20260919/writable`.
MongoDB käytti tehtävän erillistä `db`-hakemistoa. Sovelluspaketin palvelinriippuvuudet
asennettiin `meteor npm install` -komennolla sen `programs/server`-hakemistossa.

Testipalvelimen ollessa käynnissä olemassa olevat selaintestit valittiin näin:

```sh
cd tests/playwright
WEKAN_PLAYWRIGHT_ALL=1 WEKAN_PLAYWRIGHT_PROBE=0 \
node node_modules/@playwright/test/cli.js test \
  specs/12-checklists.e2e.js specs/19-accessibility.e2e.js \
  specs/07-attachments-links.e2e.js \
  --project=chromium --project=firefox --workers=1 --reporter=list --trace=on \
  --grep 'checking a checklist item adds|an opened popup is a dialog|attachment overlay provides'
```

Paikalliset tulostiedostot ovat hakemistossa `.tools/log/2026-09-19_fixes-audit/`:
`node.log`, `hunks.json`, `build.log`, `bundle-npm.log`, `server.log`, `mongod.log`,
`app-browser.log`, `audit-browser.log`, `audit-viewer-browser.log`, `browser.json`,
`logic.log`, `logic.json`, `css-regression.log`, `webkit-install.log` sekä
suoritusjälkihakemistot `app-artifacts` ja `audit-artifacts`. Nämä versionhallinnan
ulkopuolelle rajatut tiedostot ovat paikallista todistusaineistoa, eivät tämän
asiakirjan mukana jaettavia tiedostoja.

Väliaikaiset toistoskriptit ja erikseen korjatut lähdekoodimuunnelmat ovat edelleen
hakemistossa `.tools/tmp/fixes-audit-20260919/`: `browser.cjs`, `logic.cjs`,
`css-regression.cjs`, `app.config.cjs`, `audit.e2e.cjs` ja `variants.json`.
Suorita ensimmäiset kolme repositorion paikallisella `node`-komennolla.
Sovelluksen koetestit suoritetaan komennolla
`node tests/playwright/node_modules/@playwright/test/cli.js test
--config=.tools/tmp/fixes-audit-20260919/app.config.cjs`, kun tarkastuspalvelin on
käynnissä. Nämä skriptit ovat paikallisia tälle työhakemistolle. Edellä olevat
taulukot säilyttävät testitapaukset ja tulokset myös lukijoille, joilla ei ole
näitä tiedostoja.
