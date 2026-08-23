# Jalor

**Jalor** est une application libre de gestion collaborative des tâches et des projets, basée sur [WeKan](https://github.com/wekan/wekan) et adaptée à l'écosystème numérique du service public français.

L'objectif du projet est de proposer une solution de type Kanban :

* simple à déployer ;
* auto-hébergeable ;
* compatible Docker ;
* adaptée aux usages d'équipes ;
* utilisant le [Système de Design de l'État — DSFR](https://www.systeme-de-design.gouv.fr/) ;
* orientée accessibilité et sobriété ;
* sans dépendance à un service SaaS propriétaire.

> Jalor est un fork indépendant de WeKan et n'est pas affilié au projet officiel WeKan.

---

## Fonctionnalités

Jalor reprend le moteur fonctionnel de WeKan et permet notamment de :

* créer des tableaux Kanban ;
* organiser le travail en listes et cartes ;
* déplacer les cartes par glisser-déposer ;
* assigner des utilisateurs ;
* ajouter des étiquettes ;
* définir des échéances ;
* utiliser des checklists ;
* commenter les cartes ;
* joindre des fichiers ;
* suivre l'activité d'un tableau ;
* gérer plusieurs utilisateurs et équipes ;
* administrer les droits d'accès.

Le projet vise progressivement à proposer une interface entièrement adaptée au DSFR.

---

## État du projet

Jalor est actuellement en cours d'adaptation à partir de WeKan.

Les principaux axes de travail sont :

1. remplacement progressif de l'interface WeKan par une interface DSFR ;
2. simplification de l'expérience utilisateur ;
3. francisation des parcours principaux ;
4. amélioration de l'accessibilité ;
5. harmonisation avec les autres applications de la suite **Outils Publics** ;
6. simplification du déploiement Docker ;
7. conservation de la compatibilité avec les fonctionnalités principales de WeKan.

Certaines parties de l'interface peuvent donc encore utiliser le design historique de WeKan.

---

## DSFR

Jalor utilise progressivement le **Système de Design de l'État (DSFR)**.

Documentation officielle :

[https://www.systeme-de-design.gouv.fr/](https://www.systeme-de-design.gouv.fr/)

Le DSFR est mis à disposition par le Service d'Information du Gouvernement.

Son utilisation est soumise à ses propres conditions d'utilisation.
Le fait que Jalor soit un logiciel libre ne signifie pas que l'utilisation de l'identité visuelle de l'État soit libre de toute restriction.

Les organismes utilisant ou redistribuant Jalor doivent vérifier qu'ils sont autorisés à utiliser le DSFR et les éléments d'identité associés.

---

## Langues

Jalor conserve intégralement le système multilingue de WeKan. L'interface est
[traduite](https://app.transifex.com/wekan/wekan/) en 234 langues,
dont 142 essentiellement complètes.

Le français est la langue **par défaut** : c'est celle qu'obtient une personne
dont le navigateur ne demande aucune des langues disponibles, et celle des
notifications envoyées à un compte qui n'a pas choisi la sienne. Le choix
individuel de langue reste disponible sur l'écran de connexion et dans les
paramètres du compte, et il l'emporte toujours.

L'anglais reste la langue de repli d'une **chaîne manquante** : c'est une autre
question, et elle garde sa réponse, sinon une clé non traduite n'afficherait
rien du tout.

---

## Installation avec Docker

Le mode de déploiement recommandé à terme est Docker Compose.

### Prérequis

* Docker
* Docker Compose
* au minimum 4 Go de RAM recommandés pour un serveur de production ;
* suffisamment d'espace disque pour MongoDB et les pièces jointes.

### Démarrage

Clonez le dépôt :

```bash
git clone https://github.com/OUTILS-PUBLICS/jalor.git
cd jalor
```

Puis lancez l'application :

```bash
docker compose up -d
```

L'application est ensuite disponible, par défaut, sur :

```text
http://localhost:3000
```

> Les paramètres Docker peuvent évoluer pendant la phase de transformation du fork. Consultez toujours le fichier `docker-compose.yml` présent dans le dépôt.

---

## Développement

Jalor est actuellement basé sur l'architecture de WeKan.

La branche upstream de WeKan utilise :

* Meteor 3.5 ;
* Node.js 24.x ;
* MongoDB.

### Prérequis

Installez :

* Git ;
* Node.js 24.x ;
* Meteor ;
* MongoDB si vous ne l'utilisez pas via Docker.

### Node.js

L'utilisation de `nvm` est recommandée :

```bash
nvm install 24
nvm use 24
```

### Meteor

```bash
curl https://install.meteor.com/ | sh
```

---

## Lancer Jalor depuis les sources

```bash
git clone https://github.com/OUTILS-PUBLICS/jalor.git
cd jalor
```

Sous Linux/macOS :

```bash
chmod +x build.sh
./build.sh
```

Sous Windows :

```powershell
build.bat
```

Le script de build hérité de WeKan propose plusieurs catégories :

```text
1) Setup
2) Dev server
3) Tests
4) Docker
5) Tools
6) Quit
```

Pour démarrer un environnement de développement :

### 1. Installer les dépendances

```text
Setup
└── Install dependencies
```

### 2. Construire l'application

```text
Setup
└── Build WeKan
```

Cette appellation peut subsister temporairement dans les scripts hérités de WeKan.

### 3. Démarrer le serveur

```text
Dev server
└── localhost:3000
```

L'application sera disponible sur :

```text
http://localhost:3000
```

Meteor reconstruit automatiquement l'application lors des modifications du code.

---

## Architecture du projet

Jalor repose pour le moment largement sur l'architecture historique de WeKan.

```text
jalor/
├── client/
├── imports/
│   ├── client/
│   ├── server/
│   ├── api/
│   └── i18n/
├── server/
├── public/
├── tests/
├── docker-compose.yml
├── build.sh
└── build.bat
```

Cette architecture pourra évoluer au fur et à mesure de l'adaptation du projet.

---

## Base de données

Jalor utilise actuellement **MongoDB**, comme WeKan.

Les données persistantes comprennent notamment :

* utilisateurs ;
* tableaux ;
* listes ;
* cartes ;
* commentaires ;
* checklists ;
* paramètres ;
* métadonnées ;
* pièces jointes selon la configuration.

### Sauvegardes

Une sauvegarde régulière de MongoDB est fortement recommandée.

En production, prévoyez au minimum :

* une sauvegarde quotidienne ;
* une copie externe au serveur principal ;
* une politique de rétention ;
* des tests réguliers de restauration.

Une saturation du disque peut provoquer des problèmes importants sur MongoDB.

---

## Sécurité

Pour une utilisation en production :

* utilisez toujours une version maintenue de Jalor ;
* maintenez Node.js, Meteor et MongoDB à jour ;
* utilisez HTTPS ;
* protégez l'accès à MongoDB ;
* n'exposez jamais directement la base de données sur Internet ;
* appliquez une politique de sauvegarde ;
* utilisez des mots de passe robustes ;
* configurez correctement les mécanismes d'authentification disponibles ;
* surveillez l'espace disque et l'état du serveur.

Les correctifs provenant du projet WeKan pourront être régulièrement intégrés dans Jalor.

---

## Relation avec WeKan

Jalor est basé sur :

[WeKan — Open Source Kanban](https://github.com/wekan/wekan)

WeKan est un logiciel libre distribué sous licence MIT.

Le projet Jalor conserve une relation avec le dépôt upstream afin de pouvoir intégrer lorsque cela est pertinent :

* correctifs de sécurité ;
* corrections de bugs ;
* améliorations de performances ;
* évolutions de compatibilité ;
* améliorations fonctionnelles.

Une adaptation importante de l'interface peut néanmoins rendre certaines mises à jour upstream plus complexes à intégrer.

---

## Synchronisation avec WeKan upstream

Pour les développeurs travaillant sur le fork, il est recommandé de conserver le dépôt officiel WeKan comme remote `upstream`.

```bash
git remote add upstream https://github.com/wekan/wekan.git
```

Vérification :

```bash
git remote -v
```

Exemple :

```text
origin    https://github.com/OUTILS-PUBLICS/jalor.git
upstream  https://github.com/wekan/wekan.git
```

Pour récupérer les évolutions de WeKan :

```bash
git fetch upstream
```

Puis intégrer les changements souhaités dans Jalor selon la stratégie de branches du projet.

---

## Traductions

Jalor vise une expérience **française complète par défaut**, tout en conservant autant que possible les mécanismes d'internationalisation de WeKan.

Les fichiers de traduction hérités de WeKan se trouvent notamment dans :

```text
imports/i18n/
```

Les traductions provenant directement du projet WeKan restent gérées par leur communauté sur Transifex :

[https://app.transifex.com/wekan/wekan/](https://app.transifex.com/wekan/wekan/)

Les traductions propres à Jalor peuvent être maintenues directement dans ce dépôt.

---

## Accessibilité

L'accessibilité constitue un objectif important du projet.

L'adaptation DSFR doit notamment prendre en compte :

* navigation au clavier ;
* contrastes ;
* focus visibles ;
* structure sémantique ;
* lecteurs d'écran ;
* formulaires accessibles ;
* modales accessibles ;
* alternatives textuelles ;
* responsive design ;
* réduction des interactions exclusivement basées sur le glisser-déposer.

L'objectif à terme est de tendre vers une conformité aussi large que possible avec le **RGAA**.

---

## Principes du projet

Jalor vise à rester :

* libre ;
* auto-hébergeable ;
* documenté ;
* déployable avec Docker ;
* sans dépendance SaaS obligatoire ;
* compatible avec des infrastructures internes ;
* accessible ;
* sobre ;
* compréhensible par des utilisateurs non techniques ;
* maintenable sur le long terme.

---

## Outils Publics

Jalor s'inscrit dans une démarche plus large de création d'outils numériques libres et auto-hébergeables adaptés aux besoins du service public.

Chaque application vise à pouvoir être déployée indépendamment.

Exemples de briques pouvant appartenir à cette suite :

```text
Outils Publics
├── Portail
├── Trombinoscope
├── Wiki
└── Jalor
```

Jalor correspond à la brique de **gestion collaborative des tâches et tableaux Kanban**.

---

## Contribution

Les contributions sont les bienvenues.

Avant de proposer une modification importante :

1. vérifiez qu'une issue similaire n'existe pas ;
2. ouvrez une issue décrivant le besoin ;
3. créez une branche dédiée ;
4. développez et testez votre modification ;
5. soumettez une Pull Request.

Pour les modifications d'interface, veillez notamment à respecter :

* les composants DSFR ;
* l'accessibilité ;
* la cohérence visuelle ;
* le responsive design ;
* la compatibilité avec les fonctionnalités existantes.

---

## Signaler un problème

Les bugs concernant **Jalor** doivent être signalés sur le dépôt Jalor.

Les problèmes reproductibles uniquement sur WeKan upstream peuvent également être vérifiés dans le tracker officiel :

[https://github.com/wekan/wekan/issues](https://github.com/wekan/wekan/issues)

Lorsqu'un problème provient directement du code upstream, merci de le préciser dans l'issue.

---

## Licence

Le code original de WeKan est distribué sous **licence MIT**.

Jalor est une œuvre dérivée de WeKan et conserve les notices de copyright et de licence requises pour le code provenant du projet original.

Consultez le fichier [`LICENSE`](LICENSE) pour le texte complet de la licence applicable.

WeKan et les marques associées appartiennent à leurs détenteurs respectifs.

**Jalor est un projet indépendant et n'est ni une version officielle de WeKan, ni affilié, ni sponsorisé par le projet WeKan.**

---

## Crédits

Jalor n'existerait pas sans le travail réalisé depuis de nombreuses années par les contributeurs de WeKan.

Projet original :

**WeKan — Open Source Kanban**
[https://github.com/wekan/wekan](https://github.com/wekan/wekan)

Merci à l'ensemble de ses contributeurs.

---

## Liens utiles

* [WeKan](https://github.com/wekan/wekan)
* [Documentation WeKan](https://github.com/wekan/wekan/tree/main/docs)
* [DSFR](https://www.systeme-de-design.gouv.fr/)
* [RGAA](https://accessibilite.numerique.gouv.fr/)
* [Licence MIT](LICENSE)
