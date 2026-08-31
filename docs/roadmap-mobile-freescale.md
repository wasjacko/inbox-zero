# Roadmap d’adaptation mobile — Freescale

> **Règle absolue : le desktop est gelé.** Aucun changement de layout, style, wording ou comportement à partir de 1024 px. La totalité du chantier concerne uniquement les viewports inférieurs à 1024 px, onboarding compris.

## Objectif

Construire une expérience mobile native dans ses usages, sans réduire l’interface desktop. La navigation doit rester accessible au pouce, le contenu prioritaire doit apparaître avant les outils secondaires, et Mue doit rester disponible sans masquer le contexte courant.

## Cibles et règles transversales

- Mobile compact : 320–389 px.
- Mobile standard : 390–767 px.
- Tablette : 768–1023 px.
- Desktop : 1024 px et plus.
- Cibles tactiles : 44 × 44 px minimum.
- Respect des safe areas iOS et Android.
- Une seule zone de défilement principale par écran.
- Aucune action essentielle uniquement accessible au survol.
- Les tableaux deviennent des listes ou cartes, jamais des tableaux compressés.
- Les actions destructrices passent par une confirmation en bottom sheet.
- Le clavier ne doit jamais recouvrir l’action principale ou l’input de Mue.

## Contrat d’implémentation — préserver le desktop

### Stratégie de rendu

- Une restructuration importante utilise deux rendus : mobile en `lg:hidden`, desktop existant en `hidden lg:block` ou équivalent.
- Une correction légère utilise exclusivement des variantes `max-lg:` ou des styles placés sous `@media (max-width: 1023px)`.
- Interdiction de modifier une classe desktop existante sans capture avant/après à 1024 et 1440 px.
- Les données et handlers peuvent être partagés ; seuls les composants de présentation divergent.
- Les overlays mobiles sont rendus dans un portal et ne changent pas les dimensions du contenu desktop.
- Toute primitive mobile doit rester inactive et absente de l’arbre accessible à partir de 1024 px.

### Validation obligatoire pour chaque ticket

- Capture avant/après : 390 × 844 et 768 × 1024.
- Capture de non-régression : 1024 × 768 et 1440 × 900.
- Test sans souris : tap, swipe, retour navigateur, clavier virtuel.
- Test avec contenu long : nom d’espace, contact, objet et message.
- Test avec état vide, état chargé, erreur et sélection multiple si applicable.
- Vérifier `prefers-reduced-motion`, mode sombre et zoom texte 200 %.
- Le ticket n’est pas terminé si le desktop diffère visuellement sans demande explicite.

## Inventaire des surfaces à adapter

### Shell partagé

- Sidebar desktop : conservée intacte et masquée sous 1024 px.
- Top bar desktop : conservée intacte et remplacée par `MobileTopBar` sous 1024 px.
- Bottom bar : nouvelle, mobile uniquement.
- Menu espace/compte : nouvelle bottom sheet mobile.
- Recherche globale : nouvelle vue plein écran mobile.
- Mue : nouvelle sheet mobile, panneau desktop inchangé.
- Dialogs, dropdowns, tooltips, tableaux, filtres et barres de sélection : comportement mobile normalisé.

### Routes cœur

- `/chat`, y compris Brief, Ask Mue, détail conversation et suggestion de réponse.
- `/channels-v4`, y compris liste, conversation, filtres, tags, détails et sélection multiple.
- `/tasks`, y compris liste, kanban, filtres, création, détail et tutoriel Mue.
- `/stats`, y compris état zéro, KPI, graphiques et détails clients.
- `/bulk-unsubscribe`, y compris actif, retirés, paramètres et restauration.
- `/bulk-archive`, y compris stockage, catégories, gestion et suppression définitive.
- `/settings`, toutes les sections.
- `/organization`, espace actif et édition.

### Entrée et activation

- `/login` et création de compte.
- `/onboarding`, toutes les étapes et tous les états du scan.
- `/setup`, checklist et reprise de configuration.

### Secondaire

- `/help`, `/support`, `/premium`, `/drive`, `/integrations`, `/calendars`, `/briefs`, `/automation`.
- Routes utilitaires conservées après arbitrage produit.

## Phase 0 — Fondations et audit

1. Capturer chaque route à 320, 390, 430, 768 et 1024 px.
2. Lister les débordements, contenus tronqués, doubles scrolls et actions hors écran.
3. Définir les tokens mobiles : espacements, hauteurs de barres, rayons, ombres, typographie et safe areas.
4. Créer les primitives partagées : `MobileTopBar`, `MobileBottomBar`, `MobileSheet`, `MobilePageHeader`, `MobileFilterBar`, `MobileActionBar` et `MobileListItem`.
5. Prévoir les états clavier ouvert, offline, chargement, vide, erreur et skeleton.

## Phase 1 — Navigation globale

### 1.1 Top bar

- Gauche : espace actif ou retour contextuel.
- Centre : titre de la page, tronqué sur une ligne.
- Droite : recherche puis Mue, avec badges discrets.
- Masquer les contrôles desktop redondants.
- Top bar sticky, hauteur stable et compatible safe area.

### 1.2 Bottom bar principale

Quatre destinations permanentes :

1. Accueil.
2. Canaux.
3. Tâches.
4. Plus.

Le bouton Mue est une action flottante centrale ou immédiatement au-dessus de la bottom bar, mais ne devient pas une cinquième page. « Plus » ouvre une bottom sheet avec Relations clients, Désabonnement, Archivage, Organisation, Paramètres et Aide.

À prévoir : état actif, badge non lu, libellés courts, safe area, masquage contrôlé au scroll et restauration immédiate au scroll inverse.

### 1.3 Menu espace et compte

- Tap sur l’espace : bottom sheet compacte.
- Changer ou gérer l’espace, plan, organisation, aide, compte et déconnexion.
- Aucun dropdown desktop réutilisé tel quel.

### 1.4 Recherche globale

- Tap sur recherche : page plein écran, pas une petite modale.
- Champ autofocus, bouton Annuler, historique récent et suggestions.
- Filtres Tout, Messages, Tâches, Clients et Documents en chips horizontales.
- Résultats groupés par type, avec source et action claire.
- Clavier, état vide, chargement et navigation retour préservée.

### 1.5 Panneau Mue

- Mobile : bottom sheet trois hauteurs — aperçu, demi-écran, plein écran.
- Poignée de glissement, fermeture par swipe, backdrop et conservation du brouillon.
- En-tête : image de Mue, contexte courant et bouton fermer.
- Corps : réponse ou résultat scrollable.
- Bas : input sticky au-dessus du clavier, suggestions compactes et validation explicite.
- Les actions Créer, Trouver, Rechercher, Modifier et Planifier restent visibles en chips ; leurs propositions s’ouvrent sans pousser tout le contenu.
- Le changement d’expression de Mue ne modifie jamais sa taille ni la mise en page.

## Phase 2 — Pages cœur

### 2.1 AI Home `/chat`

- Un seul écran d’accueil priorisé ; Ask Mue reste accessible par le bouton Mue global.
- Salutation et compteur de messages non lus.
- Une seule liste « À traiter », sans carrousel ni contenu dupliqué.
- Conversation : messages plein écran, composer sticky et actions de réponse dans une sheet.
- Suggestion Mue : portrait, texte éditable, variantes et CTA d’envoi accessibles au pouce.
- Entrée post-onboarding : animation légère, sans bloquer la navigation.

### 2.2 Canaux `/channels-v4`

- Header, canaux connectés et ajout de canal.
- Tabs ou filtres sources scrollables horizontalement.
- Liste des conversations avec source, non-lu, priorité et aperçu.
- Vue conversation en navigation maître-détail : liste → conversation → retour.
- Recherche locale et filtres dans une bottom sheet.
- Tags : création, attribution et suppression par sheet.
- Sélection multiple : barre d’action sticky au-dessus de la bottom bar.
- Résumé et informations latérales desktop déplacés dans une sheet « Détails ».

### 2.3 Tâches `/tasks`

- Résumé compact : aujourd’hui, en retard, à venir.
- Vue liste unique sur mobile ; le kanban reste exclusivement disponible sur desktop.
- Filtres et tri dans une sheet.
- Création rapide depuis un bouton flottant.
- Carte tâche : titre, client, échéance et statut visibles sans ouvrir.
- Détail tâche plein écran ou sheet haute, avec actions sticky.
- Tutoriel Mue repositionné pour ne pas masquer la bottom bar.

### 2.4 Relations clients `/stats`

- État zéro cohérent avant toute action réalisée.
- Indicateurs sous forme de cartes 2 colonnes puis 1 colonne en compact.
- Graphiques simplifiés, légendes tactiles et période dans une sheet.
- Clients à risque et relances sous forme de liste priorisée.
- Temps gagné affiché seulement après une vraie action.
- Détail client en page dédiée ou sheet plein écran.

### 2.5 Désabonnement `/bulk-unsubscribe`

- Compteur et bénéfice attendu avant la liste.
- Filtres par fréquence, volume et catégorie dans une sheet.
- Cartes expéditeur avec sélection tactile claire.
- Multi-sélection : CTA Désabonner sticky.
- Vue « Éléments retirés » : CTA Restaurer, jamais Désabonner.
- Paramètres et historique dans une sheet secondaire discrète.
- Confirmation et feedback après action.

### 2.6 Archivage `/bulk-archive`

- Stockage utilisé visible dans le header compact.
- Catégories adaptées : conversations supprimées, PDF/factures, images IA et contextes projets inactifs.
- Liste avec poids, date et catégorie.
- Filtres/tri dans une sheet.
- CTA Gérer par élément : Restaurer ou Supprimer définitivement.
- Multi-sélection avec barre sticky et avertissement destructif.

### 2.7 Paramètres `/settings`

- Index mobile des sections avant le détail.
- Compte et messagerie.
- Plan et facturation.
- Intelligence artificielle et préférences de Mue.
- Apparence.
- Fonctionnalités avancées seulement si pertinentes au marché actuel.
- Chaque section devient une page secondaire avec navigation retour, pas une longue page infinie.

### 2.8 Organisation `/organization`

- Espace actif et changement d’espace.
- Renommer l’espace.
- Stockage utilisé sur 5 Go.
- Fuseau horaire.
- Aucun bloc membres ou invitations tant que cette fonctionnalité n’existe pas.
- Édition via sheet avec clavier et CTA Enregistrer sticky.

## Phase 3 — Parcours d’entrée et configuration

### 3.1 Connexion `/login`

- Carte centrée, hauteur naturelle et clavier géré.
- Google uniquement.
- Lien Créer un compte / Se connecter en bas.
- Retour visible vers la landing page.

### 3.2 Onboarding `/onboarding`

- Une colonne sur mobile ; le panneau gradient devient un header compact.
- Progression fine et toujours visible.
- Activité freelance.
- Nom du business.
- Nom de l’espace.
- Sélection des canaux.
- Connexion des canaux.
- Scan et premier brief.
- CTA bas sticky, compatible clavier et safe area.
- Mue garde une taille stable entre ses expressions.

### 3.3 Configurateur `/setup`

- Checklist 0 sur 4 au départ.
- Une carte par étape, détails repliables.
- CTA Commencer, Continuer puis Terminer la configuration.
- Progression sticky et reprise après interruption.

## Phase 4 — Pages secondaires

### 4.1 Centre d’aide `/help` et `/support`

- Recherche pleine largeur.
- Catégories en chips.
- Articles en accordéons ou pages secondaires.
- Contact support et suggestion de fonctionnalité en petites sheets.

### 4.2 Plan `/premium`

- Plan actuel, prix et cadence visibles immédiatement.
- CTA Gérer le plan.
- Avantages en liste compacte.
- Aucun sélecteur annuel/mensuel sur la page active si ce choix est géré ailleurs.

### 4.3 Drive `/drive`

- Stockage, recherche et filtres.
- Liste fichiers plutôt que grille forcée.
- Aperçu plein écran et actions dans une sheet.

### 4.4 Intégrations `/integrations` et Calendriers `/calendars`

- Services connectés d’abord.
- Catalogue ensuite, filtrable.
- Connexion et permissions dans une sheet dédiée.

### 4.5 Briefs `/briefs`

- Liste chronologique.
- Filtres compacts.
- Détail du brief plein écran avec partage et export sticky.

### 4.6 Automations `/automation`

- Liste d’automations et statut.
- Création en étapes.
- Édition plein écran, résumé avant activation.

### 4.7 Pages legacy et utilitaires

- `reply-zero`, `cold-email-blocker`, `clean`, `smart-categories`, `quick-bulk-archive` : décider d’abord si elles restent dans le produit zéro.
- Si conservées, les rattacher aux primitives mobiles des pages cœur correspondantes au lieu de créer de nouveaux patterns.
- Comptes, permissions, erreurs, accès refusé et invitations : formulaires simples, messages lisibles, CTA unique et navigation retour.

## Phase 5 — Validation

### Matrice de test par page

- 320 × 568, 390 × 844, 430 × 932, 768 × 1024.
- Portrait et paysage.
- Safari iOS et Chrome Android.
- Clavier ouvert et fermé.
- Texte agrandi à 200 %.
- Mode sombre.
- Lecteur d’écran, ordre de focus et navigation clavier.
- Connexion lente, skeleton et erreurs.
- Safe areas, bottom bar et sheets sans chevauchement.

### Critères de sortie

- Aucun débordement horizontal.
- Toutes les actions essentielles accessibles à une main.
- Aucun contenu caché derrière une barre fixe ou le clavier.
- Retour système cohérent.
- État de navigation conservé entre liste et détail.
- Lighthouse mobile et tests visuels sans régression desktop.

## Ordre de livraison recommandé

1. Shell mobile, top bar, bottom bar, recherche et Mue.
2. AI Home et Canaux.
3. Tâches et Relations clients.
4. Désabonnement et Archivage.
5. Onboarding et Configurateur.
6. Organisation, Paramètres, Plan et Aide.
7. Drive, Intégrations, Calendriers, Briefs et Automations.
8. Arbitrage puis adaptation des routes legacy.
9. Accessibilité, appareils réels, performance et finitions.

Chaque lot doit être validé sur mobile avant de passer au suivant. Le shell global est le seul prérequis bloquant ; les pages peuvent ensuite être adaptées indépendamment.

## Backlog exécutable détaillé

### Lot M0 — Infrastructure mobile

#### M0.1 Viewport et safe areas

- Confirmer `viewport-fit=cover` dans le metadata Next.js.
- Ajouter les tokens `--mobile-topbar-height`, `--mobile-bottom-bar-height`, `--safe-top` et `--safe-bottom`.
- Appliquer un padding bas au contenu égal à la bottom bar + safe area.
- Vérifier qu’aucun `100vh` ne provoque de saut sur Safari ; préférer `svh` ou `dvh` selon le composant.
- Accepter rotation portrait/paysage sans rechargement.

#### M0.2 Primitives

- `MobileTopBar` : 56 px hors safe area, titre, retour, recherche, Mue.
- `MobileBottomBar` : 4 destinations, hauteur stable, badge, état actif et safe area.
- `MobileSheet` : snap points, backdrop, focus trap, swipe down et fermeture système.
- `MobileFullScreenDialog` : header sticky, corps scrollable, footer sticky.
- `MobileFilterBar` : chips horizontales et bouton Filtres.
- `MobileSelectionBar` : compteur, annuler et CTA principal.
- `MobileEmptyState` : titre, bénéfice, CTA et aide secondaire.
- `MobileSkeleton` : mêmes dimensions que le contenu final.

#### M0.3 États système

- Le bouton retour ferme d’abord sheet/dialog, puis revient à l’écran précédent.
- Une sheet ouverte empêche le scroll du contenu arrière.
- Le focus revient au déclencheur après fermeture.
- Les toasts apparaissent au-dessus de la bottom bar.
- Une action en cours désactive uniquement son CTA, sans geler toute la page.

### Lot M1 — Navigation

#### M1.1 Bottom bar

- Accueil → `/chat`.
- Canaux → `/channels-v4`.
- Tâches → `/tasks`.
- Plus → sheet de navigation.
- Badge Canaux = conversations non lues ; badge Tâches = tâches dues.
- L’onglet actif est annoncé avec `aria-current="page"`.
- La bottom bar reste visible dans les listes, se masque dans les détails plein écran et pendant la saisie si nécessaire.

#### M1.2 Sheet Plus

- Bloc Pilotage : Relations clients.
- Bloc Nettoyage : Désabonnement, Archivage.
- Bloc Espace : Organisation, Paramètres, Plan.
- Bloc Support : Centre d’aide.
- Compte utilisateur en footer.
- Fermer automatiquement après navigation.

#### M1.3 Top bar

- Écran racine : nom d’espace à gauche, titre au centre si la largeur le permet.
- Écran détail : flèche retour à gauche, titre contextuel au centre.
- Recherche et Mue à droite, jamais plus de deux actions.
- Les actions supplémentaires passent dans un menu `…` en sheet.
- La top bar ne change pas de hauteur quand un badge apparaît.

#### M1.4 Recherche

- Ouverture en moins de 150 ms avec champ immédiatement focalisé.
- Avant saisie : recherches récentes et raccourcis.
- Pendant saisie : debounce, skeleton et résultats par catégorie.
- Après sélection : navigation puis conservation de la requête au retour.
- Appui sur Effacer vide la requête sans fermer.
- Appui sur Annuler ou retour ferme la recherche.

#### M1.5 Mue

- État fermé : bouton avec étoile simple et label accessible.
- État aperçu : contexte + actions rapides.
- État demi-écran : propositions et conversation courte.
- État plein écran : historique, résultat long et saisie.
- Expressions Mue : même cadre, même ratio et même taille ; transition par fondu court.
- Les propositions de verbes flottent au-dessus des chips et se ferment au tap extérieur.
- Après validation, afficher un état d’exécution puis un résultat, sans fermeture automatique.
- Aucun chevauchement avec le clavier, la top bar ou la bottom bar.

### Lot M2 — AI Home `/chat`

#### M2.1 État initial

- Salutation sur deux lignes maximum.
- « X messages non lus », pas « nouveaux messages ».
- Trois cartes prioritaires en pile verticale sur 320 px, carrousel seulement si chaque carte reste compréhensible isolément.
- CTA de carte entier tactile, pas uniquement la flèche.

#### M2.2 Brief

- Toggle Brief / Ask Mue sous la top bar, sticky si nécessaire.
- Résumé prioritaire visible sans scroll excessif.
- Sections secondaires repliables avec état conservé.
- Sources Gmail, Outlook et WhatsApp visibles dans les items.
- Actions Reporter, Marquer fait et Ouvrir dans une sheet si elles ne tiennent pas.

#### M2.3 Conversation

- Le détail remplace la liste ; retour restaure position et filtre.
- Header contact sticky : avatar, nom, canal et menu.
- Bulles à largeur maximale de 88 %, heures lisibles et liens tactiles.
- Composer sticky, extensible jusqu’à 5 lignes.
- Pièces jointes, envoyer et options restent accessibles quand le clavier est ouvert.

#### M2.4 Suggestion de réponse Mue

- Portrait Mue 24–32 px avec texte de statut.
- Aucun switch « Mue actif ».
- Réponse éditable sans mode secondaire.
- Variantes « Plus court », « Plus cordial », « Autre proposition » scrollables horizontalement.
- CTA Envoyer pleine largeur sur compact, aligné à droite sur tablette.
- Après envoi : confirmation, mise à jour de la conversation et focus rendu au contenu.

### Lot M3 — Canaux `/channels-v4`

#### M3.1 Liste

- Header compact avec total non lu et ajout de canal.
- Filtres sources en chips avec logo et compteur.
- Une ligne conversation montre : avatar, nom, source, heure, aperçu, badge non lu et priorité.
- Swipe optionnel uniquement comme raccourci ; les mêmes actions restent accessibles dans le menu.
- Skeleton de liste et pagination/infinite scroll sans saut.

#### M3.2 Filtres et recherche locale

- Recherche sticky sous le header ou déclenchée depuis la top bar.
- Sheet filtres : canal, statut, client, tag et période.
- Nombre de filtres actifs visible sur le bouton.
- CTA Réinitialiser et Appliquer distincts.

#### M3.3 Tags

- Tags visibles sur deux lignes maximum dans la liste.
- Ajouter/modifier via sheet avec recherche et création.
- Nouveau tag : nom, couleur, aperçu et validation.
- Retour à la conversation sans perdre le scroll.

#### M3.4 Sélection multiple

- Appui long ou bouton Sélectionner ; ne pas dépendre d’une petite checkbox.
- Barre sticky : nombre, marquer lu, taguer, archiver et plus.
- Annuler restaure l’état sans action.
- Confirmation uniquement pour l’action destructive.

#### M3.5 Détail

- Conversation en plein écran.
- Résumé Mue et informations client dans une sheet Détails.
- CTA Répondre/Composer au-dessus de la safe area.
- Navigation conversation précédente/suivante seulement si compréhensible au tactile.

### Lot M4 — Tâches `/tasks`

#### M4.1 Navigation interne

- Segments Aujourd’hui, À venir, Terminées.
- Vue Liste par défaut ; Kanban dans une vue séparée, pas un tableau horizontal miniature.
- Filtres visibles par badge.

#### M4.2 Cartes et actions

- Carte entière ouvrable, avec checkbox d’au moins 44 px.
- Afficher priorité, client et échéance avant la description.
- Menu secondaire en sheet.
- Modification statut avec feedback immédiat et annulation possible.

#### M4.3 Création et détail

- FAB « + » au-dessus de la bottom bar.
- Sheet de création : titre obligatoire, client, échéance, priorité, note.
- CTA Créer sticky et clavier géré.
- Détail en plein écran avec modifier, terminer et supprimer.

### Lot M5 — Relations clients `/stats`

#### M5.1 État zéro

- Temps gagné = 0 tant qu’aucune action n’est terminée.
- Expliquer ce qui alimentera les métriques.
- CTA unique vers la prochaine action utile.

#### M5.2 KPI et graphiques

- Ordre : réponses attendues, relances, clients à risque, temps gagné.
- Deux colonnes à 390–767 px, une colonne sous 390 px si le contenu tronque.
- Période et filtres dans une sheet.
- Graphiques avec résumé textuel accessible.
- Tooltip activé au tap et refermable.

#### M5.3 Listes clients

- Trier par urgence réelle.
- Carte : nom, dernier échange, signal, prochaine action.
- Détail client plein écran avec historique et CTA de relance sticky.

### Lot M6 — Nettoyage

#### M6.1 Désabonnement

- Tabs Actifs / Retirés dans le header.
- Actifs : sélection → Désabonner.
- Retirés : sélection → Restaurer.
- Aucun mélange de ces actions dans une même barre.
- Paramètres via icône discrète et sheet.
- Les données critiques de l’expéditeur restent visibles sans ouvrir.

#### M6.2 Archivage

- Stockage utilisé dans une carte compacte non sticky.
- Catégories en filtres, pas en colonnes.
- Bouton Gérer ouvre Restaurer et Supprimer définitivement.
- Suppression définitive : dialog plein écran compact avec nom, poids et conséquence.
- Après action : élément retiré de la liste, toast avec annulation lorsque possible.

### Lot M7 — Onboarding mobile `/onboarding`

#### M7.1 Shell

- Desktop actuel conservé tel quel à partir de 1024 px.
- Sous 1024 px : un rendu mobile dédié, sans panneau gauche permanent.
- Header gradient compact de 120–160 px avec Freescale, progression et wording de l’étape.
- Contenu dans une seule colonne avec padding 20 px.
- Footer sticky : Retour à gauche, CTA principal à droite ou pleine largeur sur 320 px.
- « Configurer plus tard » accessible dans le header sans concurrencer le CTA.

#### M7.2 Activité freelance

- Titre court, activité en select plein écran ou sheet.
- Business name dans un champ unique.
- Le clavier pousse le contenu mais pas le CTA hors écran.
- Continuer désactivé tant que les deux valeurs sont vides.
- Erreur textuelle sous le champ, jamais seulement une bordure rouge.

#### M7.3 Création de l’espace

- Champ prérempli à partir du business name, modifiable.
- Aperçu discret de l’initiale de l’espace.
- Limite et validation du nom.
- Sauvegarde avant passage à l’étape suivante.
- Le nom doit apparaître ensuite dans la top bar et Organisation.

#### M7.4 Choix des canaux

- Une ligne par Gmail, Outlook, WhatsApp et Slack.
- Logo réel, nom, description courte et switch 44 px.
- Continuer indisponible si aucun canal ; Configurer plus tard permet de passer.
- Pas de grille compressée.

#### M7.5 Connexion des canaux

- Une carte par canal sélectionné.
- État À connecter, Connexion, Connecté, Erreur.
- Check sur le logo quand connecté.
- Continuer possible avec une connexion partielle ; wording adapté au nombre connecté.
- Déconnecter reste secondaire.

#### M7.6 Scan

- Séquence suffisamment longue pour être comprise, mais skippable après le premier résultat utile.
- Gmail : anneau de progression, compteur de mails et validation.
- WhatsApp : anneau, compteur de messages et validation.
- Phase Compréhension : classification des échanges sans faux détail technique.
- Résultat : cartes Réponses attendues, Relances et Sujets du jour.
- Animation `transform/opacity`, pas de changement brutal de hauteur.
- Mue reste à taille constante et change uniquement d’expression.
- `prefers-reduced-motion` remplace l’animation par des états successifs simples.

#### M7.7 Sortie

- CTA final « Accéder à l’espace ».
- Navigation vers `/chat?onboarding=complete` ou route finale choisie.
- Animation d’entrée légère vers AI Home.
- Données d’onboarding conservées au retour et après rafraîchissement.

### Lot M8 — Configurateur `/setup`

- Départ strict à 0/4.
- Header : progression et prochaine étape.
- Cartes repliables : identité espace, canaux, préférences Mue, premier workflow.
- Wording CTA : Commencer, Continuer, Terminer à la dernière action.
- Une seule étape ouverte à la fois sur compact.
- Reprise exacte après navigation ou fermeture.

### Lot M9 — Paramètres, Organisation, Plan, Aide

#### Paramètres

- Index racine, puis sous-page par section.
- Lignes tactiles 52–60 px, valeur actuelle visible.
- Enregistrement explicite seulement pour les formulaires longs ; autosave avec feedback pour les toggles.

#### Organisation

- Carte espace actif, nom, stockage et fuseau.
- Renommer en sheet, validation et propagation immédiate.
- Aucun membre/invitation.

#### Plan

- Plan actif, prix, prochaine facturation et CTA Gérer.
- Les détails contractuels restent lisibles sans tableau.

#### Aide

- Recherche, catégories, articles et support.
- Suggestion de fonctionnalité en sheet avec une seule question et un textarea.
- Focus conforme à la charte, sans halo navigateur non maîtrisé.

### Lot M10 — Pages secondaires

- Drive : liste, stockage, filtres, aperçu.
- Intégrations : connectées, catalogue, permissions.
- Calendriers : calendrier actif, comptes, réglages.
- Briefs : liste, détail, partage/export.
- Automations : liste, création guidée, édition et activation.
- Pour chacune : top bar, état vide, filtre, liste, détail, action principale, erreur, loading et retour.

## Définition de terminé par page

Une page est mobile-ready uniquement si :

1. Son entrée depuis la bottom bar ou la sheet Plus fonctionne.
2. Sa top bar affiche le bon titre et le bon retour.
3. Son contenu tient à 320 px sans scroll horizontal.
4. Ses filtres, menus et détails utilisent les primitives mobiles prévues.
5. Son action principale reste atteignable avec le clavier ouvert.
6. Ses états vide, loading, erreur et succès sont présents.
7. Le panneau Mue s’ouvre dans le bon contexte sans masquer une action critique.
8. La navigation retour restaure scroll, filtre et sélection.
9. Les captures 1024 et 1440 px sont identiques au desktop gelé.
10. Les tests accessibilité et reduced motion passent.
