# La couche d'interface Jalor

## Le principe

Jalor ne réécrit pas l'interface de WeKan : il la **restyle par-dessus**. C'est
la décision structurante du fork, et elle est prise pour une raison précise —
pouvoir continuer à récupérer les évolutions d'un projet upstream très actif.

Trois couches, dans cet ordre (`client/styles.js`) :

```text
1. DSFR officiel        client/jalor/vendor/    remise à zéro, ~1000 jetons, composants fr-*
2. styles WeKan         client/components/      INCHANGÉS
3. couche Jalor         client/jalor/           l'apparence Jalor
```

L'ordre n'est pas une commodité, c'est ce qui fait fonctionner l'ensemble :

- le DSFR **en premier**, parce qu'il porte une remise à zéro d'éléments
  (`*`, `body`, `a`, `button`, `input`, `h1`–`h6`, `ul`, `li`, `p`). Chargée
  après WeKan, elle écraserait ses styles sans discernement. Chargée avant,
  WeKan garde le dernier mot sur toute règle que les deux se disputent, et le
  DSFR ne remplit que ce que WeKan n'a jamais stylé ;
- la couche Jalor **en dernier**, parce que c'est elle que l'on doit voir.

## Ce que contient chaque fichier

| Fichier | Périmètre |
| --- | --- |
| `jalor-tokens.css` | le pont : chaque nom `--jalor-*` y est défini depuis un jeton DSFR. **Seul fichier qui nomme un jeton DSFR.** |
| `jalor-base.css` | typographie (Marianne), couleurs, liens, focus, `prefers-reduced-motion` |
| `jalor-controls.css` | boutons, champs, listes déroulantes, cases à cocher, interrupteurs |
| `jalor-chrome.css` | les deux barres d'en-tête, les menus de gauche, les onglets, la pagination, les tableaux de données |
| `jalor-popup.css` | les `pop-over` de WeKan et la fenêtre modale |
| `jalor-auth.css` | connexion, inscription, mot de passe oublié |
| `jalor-boards.css` | la page « Tous les tableaux » |
| `jalor-kanban.css` | le tableau : couloirs, listes, cartes |
| `jalor-card.css` | la vue détaillée d'une carte |
| `jalor-admin.css` | le panneau d'administration, et l'impression |
| `jalorTheme.js` | branche le mode sombre du DSFR sur le thème actif de WeKan |

Ajouter un fichier signifie l'ajouter aussi à la fin de `client/styles.js`.
`tests/jalorDesignLayer.test.cjs` échoue si l'un des deux est oublié.

## Les règles que suit la couche

**Restyler les sélecteurs de WeKan, pas remplacer ses gabarits.** Une règle
écrite pour `.minicard` ou `.pop-over-list li > a` s'applique à toutes les
cartes et à tous les menus, y compris ceux qu'une version future de WeKan
ajoutera. Une classe `fr-btn` posée dans un gabarit ne s'applique qu'à cet
endroit-là, et le gabarit devient un point de conflit à chaque fusion.

**Les vrais composants DSFR là où le gabarit nous appartient.** L'écran de
connexion, la page d'accessibilité, la page de support et les messages
(« page introuvable ») utilisent `fr-callout` et consorts. Dans
`jalor-controls.css`, chaque sélecteur générique porte un `:not(.fr-btn)` /
`:not(.fr-input)` : un élément qui porte déjà une classe DSFR appartient au
DSFR, et la couche Jalor ne doit pas se battre contre lui.

**Ne pas toucher à ce que mesure le glisser-déposer.** `jalor-kanban.css` ne
modifie aucune propriété de mise en page lue par jQuery UI sortable — ni
`display`, ni `float`, ni `position`, ni `width`. Seuls changent la couleur, la
bordure, l'arrondi et les marges intérieures.

**`!important` seulement quand upstream en met un.** Il y en a deux dans toute
la couche, et les deux sont dans `jalor-kanban.css` : WeKan écrit
`background-color: ... !important` sur `.list-header`, et il n'existe aucune
autre façon de changer cette couleur. `tests/jalorDesignLayer.test.cjs` compte
les occurrences et échoue si elles se multiplient.

**Les tailles de texte suivent le réglage de l'utilisateur.** Elles sont
écrites `calc(Npx * var(--wekan-ui-font-scale, 1))`, comme partout ailleurs dans
WeKan, pour que Paramètres du membre / Police / Taille agisse aussi sur la
couche Jalor.

## Densité : ce qui est repris du DSFR, et ce qui ne l'est pas

Le DSFR est conçu pour des pages éditoriales. Jalor est une application métier :
un tableau doit montrer quatre ou cinq colonnes à la fois sur un portable, et
une colonne six ou sept cartes sans défilement.

Sont repris : les angles droits, les bordures à la place des ombres portées, le
Bleu France comme unique accent, l'échelle de gris, la typographie Marianne, les
états (survol, focus, désactivé, erreur), le pas de 4 px.

Ne sont pas repris : le rythme vertical des pages éditoriales, la taille de base
de 16 px (Jalor est à 14 px pour l'habillage ; la description d'une carte et les
commentaires, qui sont du texte à lire, remontent à 16 px), et les grandes
marges intérieures des composants.

La hiérarchie des surfaces d'un tableau, qui est ce qui le rend lisible d'un
coup d'œil :

```text
plan de travail   --background-contrast-grey    le plus sombre
colonne           --background-default-grey     blanc
en-tête de liste  --background-alt-grey         un ton en arrière
carte             blanc + une bordure de 1 px   une tuile posée sur la colonne
```

## Couleurs de tableau et thèmes

Les couleurs de tableau de WeKan continuent de fonctionner sans que la couche
Jalor ait à connaître leur liste : chaque règle `.swimlane-blue`,
`.minicard-red`… d'upstream porte un `!important`, donc un tableau coloré
repeint par-dessus la couche.

Les **thèmes** fonctionnent aussi : les barres d'en-tête lisent
`var(--theme-accent, ...)`, la variable que
`client/components/main/globalThemeColor.js` publie quand un thème de site, de
tableau ou d'utilisateur est actif — et qu'il retire quand il n'y en a pas. Sans
thème, l'en-tête est en Bleu France ; avec un thème, il prend sa couleur, comme
avant.

## Accessibilité

Ce que la couche garantit, et qu'un test retient :

- **un seul anneau de focus**, celui du DSFR, sur `:focus-visible`, et rendu aux
  endroits où WeKan l'avait retiré ;
- **le lien d'évitement** (« aller au contenu ») rendu visible au focus ;
- **`prefers-reduced-motion`** neutralise les animations ;
- **déplacer une carte sans souris** : le mécanisme est celui de WeKan et il est
  conservé tel quel — une paire de contrôles haut/bas transparents mais réels,
  qui se révèlent au focus clavier, et « Déplacer la carte vers… » dans le menu
  de la carte. `tests/jalorAccessibleCardMove.test.cjs` retient les deux ;
- **la couleur ne porte jamais seule un sens** : les états d'erreur et de succès
  ont un filet, un fond et un texte.
