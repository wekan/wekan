# Le DSFR dans Jalor

Ce document répond à trois questions : ce qui est embarqué, comment le mettre à
jour, et ce qui a été délibérément laissé de côté.

## Ce qui est embarqué, et pourquoi il est copié

Le Système de Design de l'État est utilisé **tel que ses mainteneurs le
publient**, depuis le paquet npm officiel `@gouvfr/dsfr`. Rien n'est
réimplémenté : il n'existe nulle part dans Jalor de bouton « façon DSFR »
redessiné à la main.

`scripts/vendor-dsfr.mjs` copie ce paquet vers deux emplacements, parce que les
deux moitiés ne sont pas consommées de la même façon :

| Destination | Contenu | Pourquoi là |
| --- | --- | --- |
| `client/jalor/vendor/dsfr.min.css` | cœur, composants, utilitaires | importé **en premier** par `client/styles.js` |
| `client/jalor/vendor/dsfr.icons.css` | feuille d'icônes, réduite | idem |
| `public/dsfr/fonts/` | Marianne, Spectral | fichiers statiques servis tels quels |
| `public/dsfr/icons/` | SVG des icônes utilisées | idem |
| `public/dsfr/DSFR-LICENSE.md`, `DSFR-CGU.md`, `VERSION` | licence, modalités, version | ce qui est copié doit dire d'où il vient |

La seule modification apportée aux feuilles est la **réécriture des chemins
`url()`** : le DSFR référence ses polices et ses icônes en relatif
(`fonts/Marianne-Regular.woff2`, `../../icons/system/close-line.svg`). Passées
dans le pipeline de rspack, ces références seraient résolues comme des modules
et la construction échouerait. Elles pointent donc vers `/dsfr/...`, servi
depuis `public/`. Une règle dédiée dans `rspack.config.js` désactive la
résolution d'URL pour ces deux fichiers, et pour eux seuls.

### Les icônes sont réduites, pas toutes copiées

Le DSFR contient 1088 icônes (4,2 Mo, 1088 fichiers). Jalor conserve Font
Awesome pour les icônes de l'application — c'est ce que WeKan utilise partout —
et n'emploie les icônes DSFR que dans son propre habillage. Le script cherche
donc `fr-icon-<nom>` dans les sources et n'embarque que ces icônes-là.

**Conséquence pratique :** après avoir écrit une nouvelle classe `fr-icon-...`
dans un gabarit, relancez `node scripts/vendor-dsfr.mjs`.
`tests/jalorDsfrIcons.test.cjs` échoue si une icône utilisée n'est pas embarquée,
ce qui est le rappel prévu pour cela.

## Mettre à jour le DSFR

```bash
# 1. changer la version dans package.json (dépendance de développement)
npm install
# 2. recopier
node scripts/vendor-dsfr.mjs
# 3. vérifier
node tests/run-node-suites.cjs
```

Ne modifiez **jamais** un fichier de `client/jalor/vendor/` ou de `public/dsfr/`
à la main : la prochaine exécution du script l'écraserait.

Si la version majeure du DSFR change ses jetons, un seul fichier de Jalor est à
relire : `client/jalor/jalor-tokens.css`. C'est le seul qui nomme un jeton DSFR ;
tout le reste de la couche lit des noms `--jalor-*`.

## Les modalités d'utilisation

Le paquet `@gouvfr/dsfr` refuse de s'installer tant que le projet n'a pas
déclaré accepter ses modalités d'utilisation. `.dsfr.yml`, à la racine, porte
cette déclaration pour Jalor.

**À lire avant tout déploiement.** Le DSFR est d'usage **restreint** : il est
destiné aux services numériques de l'État et des organismes chargés d'une
mission de service public. Un organisme qui déploie ou redistribue Jalor doit
vérifier qu'il entre dans ce cadre. Le texte complet est copié dans
`public/dsfr/DSFR-CGU.md`.

Jalor **n'embarque pas le bloc-marque** (la Marianne et la mention « République
Française »), dont les règles sont plus strictes encore. Une administration qui
y a droit peut l'ajouter elle-même dans l'en-tête DSFR.

## Ce qui n'est délibérément pas utilisé

### Le JavaScript du DSFR

`dsfr.module.min.js` n'est pas chargé. Deux raisons :

1. Tous les composants DSFR employés par Jalor sont **purement CSS** (boutons,
   champs, cartes, badges, alertes, mises en avant, tableaux).
2. Les composants interactifs — menus, fenêtres modales, accordéons — sont ceux
   de WeKan, avec leur comportement déjà écrit et déjà testé (`popup.js`,
   `modal`, `escapeActions`). Charger le runtime DSFR à côté signifierait deux
   scripts liés aux mêmes éléments, chacun ouvrant et fermant ce que l'autre
   vient de fermer.

Le mode sombre du DSFR, qui est normalement piloté par ce runtime, est branché
directement sur le thème de WeKan par `client/jalor/jalorTheme.js`.

### Les composants qui n'ont pas d'équivalent ici

Le DSFR est conçu pour des sites de l'État : l'en-tête institutionnel, le pied
de page interministériel, le fil d'Ariane des pages éditoriales, le sélecteur de
langue de service public. Jalor est une application métier dense ; ces
composants n'ont rien à afficher dans un tableau Kanban et ne sont pas utilisés.
C'est aussi la raison pour laquelle la **densité** du DSFR n'est pas reprise :
voir `docs/Jalor/UI.md`.
