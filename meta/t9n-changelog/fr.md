# v0.8

Cette version continue l’implémentation des fonctionnalités basique d’un
logiciel de « kanban », en particulier:

* Pièces jointes aux cartes basiques. Si le fichier joint est une image nous
  générons une miniature qui peut être utilisé comme « couverture » de carte
  (visible dans la vue générale du tableau);
* Mention et auto-complétion des noms utilisateurs dans la description des
  cartes et les commentaires (bien que n’ayant pas encore de système de
  notification, cette fonctionnalité est moins utile qu’attendu);
* Vues filtrées, les options de filtrage actuelles sont basées sur les
  étiquettes et les membres assignés;
* Créer et supprimer des étiquettes (précédemment nous avions une liste fixée
  d’étiquettes)
* Personnalisation de la couleur de fond du tableau.

Cette version est également la première à offrir la traduction de l’interface
utilisateur.

Nouvelles langues supportées: français, allemand, japonais, portugais, et turc.

# v0.7.1

Cette version corrige les bogues suivants:

* Perte inopinée du tri des carte côté serveur;
* Correction d’un bug durant la création des tableaux;
* Focus sur le formulaire de nouvelle list si le tableau est vide.

# v0.7

Cette version débute la transition d’un projet bac à sable en quelque chose de
plus utile. En plus des améliorations de sécurité et de performance (par exemple
l’ouverture des cartes était longue car l'intégralité du DOM était re-généré).
Les nouvelles fonctionnalités incluent:

* Ajouter et supprimer des étiquettes aux cartes;
* Assigner et retirer l’assignation de membres aux cartes;
* Archiver des cartes (bien que la restauration ne soit pas encore possible);
* Tableaux favoris
* Support du markdown et des emojies dans les commentaires et la description des
  cartes;
* Auto-complétion des emojies dans l'éditeur de texte;
* Quelques raccourcis clavier (ex `Ctrl`+`Enter` pour envoyer une entrée
  multi-lignes).

Nous avons également débuté l’intégration avec la plateforme
[Sandstorm](https://sandstorm.io) [en], et distribuons un `spk` (Sandstorm
PacKage) pour cette version et les suivantes.
