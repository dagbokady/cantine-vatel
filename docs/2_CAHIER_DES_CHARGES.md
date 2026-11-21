# Cantine Vatel — Cahier des charges

## 1. Contexte et objectifs

Les cantines scolaires souffrent de longues files aux heures de pointe, de gaspillage faute de planification, d'une mauvaise prise en compte des allergies, d'un manque de transparence sur les menus et d'une gestion manuelle. L'application doit y répondre pour un établissement qui accueille primaire, collège et lycée.

Promesse : zéro file, zéro gaspillage, zéro risque allergique.

| Objectif | Indicateur |
|---|---|
| Réduire les files | Temps de passage au comptoir de quelques secondes ; occupation lissée par créneau |
| Réduire le gaspillage | Taux de gaspillage quotidien (préparé − servi − sauvé) / préparé |
| Protéger les élèves allergiques | Aucun plat incompatible commandé ou servi |
| Transparence | Menus, prix, ingrédients et allergènes visibles par élèves et parents |
| Simplifier la gestion | Fiche cuisine, appel et tableau de bord générés automatiquement |

La description détaillée des parcours est dans `1_PROCESSUS.md`.

## 2. Utilisateurs et rôles

`admin` (établissement), `cuisine`, `agent`, `enseignant`, `parent`, `eleve`. Un utilisateur a un seul rôle. Un parent peut avoir plusieurs enfants.

## 3. Exigences fonctionnelles

Priorité : P1 construit et démontré pendant le hackathon ; P2 si le temps le permet ; P3 présenté au pitch.

### 3.1 Établissement

| ID | Exigence | Priorité |
|---|---|---|
| E1 | Gérer niveaux, classes et enseignant référent | P1 (données de démo) |
| E2 | Importer ou créer les élèves : matricule, nom, classe, photo | P1 (données de démo) |
| E3 | Choisir le mode par niveau : Classe ou Commande | P1 |
| E4 | Configurer créneaux et capacités | P1 |
| E5 | Configurer le plan de salle : tables et places, places PMR | P1 |
| E6 | Configurer prix, fenêtre de commande, découvert, période de grâce | P1 |
| E7 | Valider les demandes de remboursement | P3 |

### 3.2 Cuisine et menus

| ID | Exigence | Priorité |
|---|---|---|
| C1 | Base d'ingrédients liés aux allergènes | P1 |
| C2 | Créer un plat par ses ingrédients, photo prise par la cantine ; allergènes déduits | P1 |
| C3 | Afficher nombre et pourcentage d'élèves concernés par les allergènes d'un plat | P1 |
| C4 | Publier le menu de la semaine : plat principal et version sans allergène, stock prévu | P1 |
| C5 | Fiche cuisine : portions équivalentes par plat, par créneau, par classe ; plateaux sans allergène nominatifs | P1 |
| C6 | Anti-gaspi : portions restantes à moitié prix après le service | P2 |

### 3.3 Parent

| ID | Exigence | Priorité |
|---|---|---|
| P1 | Inscription et connexion | P1 |
| P2 | Rattacher un enfant par matricule, avec confirmation nom et classe | P1 |
| P3 | Déclarer allergies et régime ; seul le parent peut les modifier | P1 |
| P4 | Recharger le crédit (mode Commande), paiement simulé | P1 |
| P5 | Payer l'abonnement mensuel (mode Classe), paiement simulé | P2 |
| P6 | Voir le menu, l'historique des repas avec ingrédients, le solde | P1 |
| P7 | Notifications dans l'application : repas servi, absence, solde bas, découvert | P1 |
| P8 | Signaler une absence avant 9 h (mode Classe) | P2 |
| P9 | Période de grâce et rappels de renouvellement | P3 |

### 3.4 Élève (mode Commande)

| ID | Exigence | Priorité |
|---|---|---|
| L1 | Connexion par matricule et PIN, sur téléphone ou borne | P1 |
| L2 | Ne voir que les plats compatibles avec ses allergies | P1 |
| L3 | Choisir la portion sur un curseur à 4 crans avec assiette dessinée ; prix proportionnel | P1 |
| L4 | Choisir créneau et place sur le plan de salle | P1 |
| L5 | Commande transactionnelle avec débit du crédit et découvert d'un plat | P1 |
| L6 | Ticket QR signé | P1 |
| L7 | Annuler avant 10 h avec remboursement | P2 |
| L8 | Mode borne : déconnexion automatique après commande | P2 |

### 3.5 Enseignant (mode Classe)

| ID | Exigence | Priorité |
|---|---|---|
| T1 | Liste de la classe avec photos, élèves allergiques en rouge | P1 |
| T2 | Appel : valider la classe puis décocher les absents | P1 |
| T3 | Appel hors ligne, synchronisé ensuite | P2 |

### 3.6 Comptoir

| ID | Exigence | Priorité |
|---|---|---|
| A1 | Scanner un ticket : photo, nom, plat, portion, place, alerte | P1 |
| A2 | Marquer la commande servie | P1 |
| A3 | Vérification hors ligne par signature et liste locale | P2 |
| A4 | Cocher les plateaux sans allergène remis (triple contrôle) | P2 |
| A5 | Marquer l'état des tables après chaque créneau | P2 |

### 3.7 Tableau de bord

| ID | Exigence | Priorité |
|---|---|---|
| D1 | Préparés, servis, restants, sauvés ; taux de gaspillage | P1 |
| D2 | Affluence par créneau, occupation de la salle | P1 |
| D3 | Recettes du jour, présence par classe | P1 |
| D4 | Répartition des allergies, tables signalées | P2 |

## 4. Règles de gestion

| ID | Règle |
|---|---|
| R1 | Les montants sont des entiers en FCFA. |
| R2 | Prix d'une commande = prix du plat × portion, arrondi à 25 FCFA. |
| R3 | Solde minimum autorisé = − prix plein du plat le moins cher du jour. Solde négatif : aucune nouvelle commande. |
| R4 | Une commande par élève et par jour. |
| R5 | Commandes ouvertes la veille au soir ; clôture principale à 10 h ; ensuite, commande possible dans la limite du stock restant jusqu'au début du créneau. |
| R6 | Annulation remboursée uniquement avant 10 h. Commande non consommée non remboursée. |
| R7 | Un plat contenant un allergène déclaré pour l'élève n'est ni proposé ni accepté par le serveur. |
| R8 | Un créneau n'accepte pas plus de commandes que sa capacité ; une place n'est attribuée qu'une fois par créneau. |
| R9 | Un ticket ne peut être servi qu'une fois. |
| R10 | Allergies modifiables par le parent uniquement. |
| R11 | Mode Classe : l'élève abonné est compté chaque jour ouvré sauf absence signalée avant 9 h. |
| R12 | Paiement validé uniquement après vérification auprès de l'agrégateur, de manière idempotente. |

## 5. Exigences non fonctionnelles

| Domaine | Exigence |
|---|---|
| Plateforme | Application web mobile-first installable (PWA) ; utilisable sur téléphone, tablette borne et tablette comptoir |
| Sécurité | Authentification JWT ; mots de passe et PIN hachés (bcrypt) ; contrôle d'accès par rôle côté serveur ; identité toujours issue du token ; un parent n'accède qu'à ses enfants ; secrets hors du dépôt ; CORS restreint |
| Intégrité | Commande, débit et stock dans une transaction avec verrouillage des lignes ; tickets signés Ed25519 |
| Hors ligne | Appel enseignant et vérification des tickets fonctionnent sans connexion, avec synchronisation |
| Performance | Scan et affichage du résultat en moins de 2 secondes |
| Accessibilité | Gros boutons (48 px min.), contrastes élevés, places PMR, libellés en français simple |
| Données | Développement sur données fictives uniquement |
| Documentation | API documentée automatiquement (Swagger `/docs`) ; README complet |

## 6. Architecture technique

| Couche | Choix |
|---|---|
| Frontend | React, Vite, Tailwind, PWA (Service Worker, IndexedDB) ; `qrcode.react`, `html5-qrcode`, `recharts`, `lucide-react`, `tweetnacl` |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 ; signature Ed25519 avec `cryptography` |
| Base | PostgreSQL |
| Paiement | Interface `PaymentProvider` : `SimulatedProvider` (démo), `CinetPayProvider` (production) |
| Déploiement | API et base sur VPS avec Docker Compose et HTTPS ; frontend sur Vercel. Plan B : Render et Neon |

## 7. Modèle de données

| Table | Champs principaux |
|---|---|
| `users` | id, nom, identifiant (email ou matricule), secret_hash, role |
| `niveaux` | id, nom, mode (classe, commande) |
| `classes` | id, nom, niveau_id, enseignant_id, creneau_id |
| `eleves` | id, user_id, matricule, nom, classe_id, parent_id, photo, allergies[], regime, solde, abonnement_jusqua |
| `allergenes` | id, nom |
| `ingredients` | id, nom |
| `ingredient_allergene` | ingredient_id, allergene_id |
| `plats` | id, nom, photo, prix, sans_allergene_de (plat_id, nullable) |
| `plat_ingredient` | plat_id, ingredient_id |
| `menu_jour` | id, date, plat_id, stock_prevu (portions), stock_restant, anti_gaspi |
| `creneaux` | id, date, heure_debut, heure_fin, capacite, type (classe, individuel) |
| `tables` | id, nom, ligne, colonne |
| `places` | id, table_id, numero, pmr |
| `commandes` | id, eleve_id, menu_jour_id, creneau_id, place_id, portion, prix, statut (commandee, servie, annulee), servie_a, created_at |
| `appels` | id, classe_id, date, enseignant_id, valide_a |
| `presences` | appel_id, eleve_id, present, plateau_remis |
| `transactions` | id, eleve_id, type (recharge, abonnement, debit, remboursement), montant, statut, reference_externe, created_at |
| `notifications` | id, parent_id, eleve_id, message, lue, created_at |
| `etat_tables` | table_id, creneau_id, etat (propre, a_nettoyer), agent_id |

## 8. Livrables du hackathon

1. Dépôt GitHub public avec commits réguliers.
2. URL de démonstration en ligne.
3. README : présentation, fonctionnalités, architecture, comptes de démo, lancement local, lien `/docs`.
4. Pitch deck de 10 diapositives au plus, envoyé avant le passage (23 au 25 novembre).

## 9. Critères d'évaluation visés

| Critère | Points | Réponse |
|---|---|---|
| Fonctionnalité | 30 | Parcours P1 complets de bout en bout |
| UX / Design | 20 | Mobile-first, curseur de portion, plan de salle, écran comptoir lisible |
| Innovation | 20 | Base ingrédients-allergènes, portion équitable, ticket signé hors ligne, appel enseignant |
| Qualité du code | 15 | Services transactionnels, contrôle d'accès serveur, secrets protégés |
| Présentation | 15 | Démo en une histoire, deux indicateurs : temps de passage et taux de gaspillage |
