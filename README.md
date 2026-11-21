<p align="center">
  <img src="Logo-cantine-vatel.png" alt="Cantine Vatel" width="180">
</p>

<h1 align="center">Cantine Vatel</h1>

<p align="center">
  <strong>Zéro file. Zéro gaspillage. Zéro risque allergique.</strong><br>
  Application web de gestion de cantine scolaire, du primaire au lycée.
</p>

<p align="center">
  <img src="docs/captures/landing-desktop.png" alt="Page d'accueil de Cantine Vatel sur ordinateur" width="72%">
  &nbsp;
  <img src="docs/captures/landing-mobile.png" alt="Page d'accueil de Cantine Vatel sur téléphone" width="20%">
</p>

<p align="center">
  <img src="docs/captures/landing-presentation.png" alt="Présentation : avant et avec Cantine Vatel" width="32%">
  <img src="docs/captures/landing-fonctionnalites.png" alt="Fonctionnalités : un espace par profil" width="32%">
  <img src="docs/captures/landing-ecoles.png" alt="Pour les écoles : gaspillage, allergies, service, paiement" width="32%">
</p>

---

## Sommaire

1. [Le problème](#1-le-problème)
2. [Notre solution](#2-notre-solution)
3. [Couverture du cahier des charges du hackathon](#3-couverture-du-cahier-des-charges-du-hackathon)
4. [Les espaces de l'application](#4-les-espaces-de-lapplication)
5. [Règles de gestion](#5-règles-de-gestion)
6. [Architecture technique](#6-architecture-technique)
7. [Structure du dépôt](#7-structure-du-dépôt)
8. [Modèle de données](#8-modèle-de-données)
9. [Sécurité et intégrité](#9-sécurité-et-intégrité)
10. [Installation et lancement en local](#10-installation-et-lancement-en-local)
11. [Comptes de démonstration](#11-comptes-de-démonstration)
12. [Scénario de démo conseillé](#12-scénario-de-démo-conseillé)
13. [Documentation de l'API](#13-documentation-de-lapi)
14. [Direction artistique](#14-direction-artistique)
15. [Limites connues et suite du projet](#15-limites-connues-et-suite-du-projet)
16. [Livrables](#16-livrables)

---

## 1. Le problème

Les cantines scolaires font face aux mêmes difficultés chaque jour :

| Difficulté | Conséquence |
|---|---|
| Longues files d'attente aux heures de pointe | Temps de pause perdu, salle saturée puis vide |
| Gaspillage alimentaire faute de planification | La cuisine prépare « au jugé », les restes partent à la poubelle |
| Régimes et allergies mal pris en compte | Risque sanitaire réel pour les élèves allergiques |
| Manque de transparence sur les menus et les tarifs | Parents et élèves découvrent le plat au comptoir |
| Gestion manuelle fastidieuse | Listes papier, comptage à la main, aucun chiffre fiable |

## 2. Notre solution

Cantine Vatel est **une seule plateforme pour tout l'établissement**, pensée pour un établissement qui accueille primaire, collège et lycée. Chaque niveau fonctionne dans l'un des deux modes suivants, choisi par l'administration :

| | Mode Classe (primaire) | Mode Commande (collège, lycée) |
|---|---|---|
| Qui choisit le repas | Personne : l'élève est inscrit d'office | L'élève, sur son téléphone ou sur la borne |
| Portion | Standard, ajustable par la cuisine | Choisie par l'élève : 1/3, 2/3 ou 3/3, prix proportionnel |
| Passage | Une vague par classe, à heure fixe | Une vague de 20 minutes et une place choisie sur le plan de salle |
| Présence | Appel fait par l'enseignant | Scan du ticket QR au comptoir |
| Allergies | Plat sans allergène servi d'office | Plats incompatibles masqués et refusés par le serveur |

Ce qui rend la solution unique :

- **Base ingrédients et allergènes déterministe.** La cuisine compose un plat à partir de ses ingrédients, le système en déduit les allergènes et affiche immédiatement combien d'élèves ne pourront pas le manger. Aucune saisie manuelle d'allergène, donc aucun oubli.
- **Portion équitable.** L'élève choisit la quantité qu'il mangera vraiment sur une assiette dessinée qui se remplit. Il paie ce qu'il prend, la cuisine prépare ce qui sera mangé.
- **Vagues et plan de salle.** Chaque élève a son heure et sa place : la file disparaît et l'occupation de la salle est lissée.
- **Ticket QR signé Ed25519.** Le ticket est infalsifiable et ne peut servir qu'une fois.
- **Suivi réel de la consommation.** La cuisine saisit le retour de chaque assiette (terminée ou non, appréciée ou non). Le système en tire des statistiques de gaspillage et propose des ajustements de portion, validés par l'administration.
- **Transparence totale pour le parent.** Menu de la semaine avec ingrédients et allergènes, historique de ce que l'enfant a réellement mangé, notifications à chaque étape.

## 3. Couverture du cahier des charges du hackathon

### Fonctionnalités minimum requises

| Exigence du guide | Statut | Où la trouver |
|---|---|---|
| Inscription et connexion | Fait | Parent : inscription par email et mot de passe. Élève : matricule et PIN à 4 chiffres, créé à la première connexion. Personnel : identifiant et mot de passe sur `/pro` |
| Consultation du menu de la semaine | Fait | Élève : `/menus`. Parent : `/parent/menu`, avec ingrédients et allergènes |
| Réservation d'un repas | Fait | Élève : `/reservation`, puis portion, vague et place |
| Affichage du solde et historique | Fait | Élève : accueil et `/profil`. Parent : fiche enfant et `/parent/paiements` |
| Création et modification des menus | Fait | Cuisine : `/cuisine/menus`, `/cuisine/plats`, `/cuisine/ingredients` |
| Visualisation des commandes du jour | Fait | Cuisine : `/cuisine` (service du jour par vague). Admin : tableau de bord |
| Tableau de bord avec statistiques de base | Fait | Admin : `/admin` et `/admin/statistiques`. Cuisine : `/cuisine/statistiques` |

### Besoins par utilisateur

| Utilisateur | Besoin exprimé | Réponse |
|---|---|---|
| Élève | Consulter le menu de la semaine | Menus à venir filtrés selon ses allergies |
| Élève | Réserver à l'avance depuis son téléphone | Commandes ouvertes la veille dès 18 h, interface mobile first |
| Élève | Payer sans argent liquide | Débit automatique du crédit rechargé par le parent |
| Élève | Plats disponibles selon ses restrictions (bonus) | Plats incompatibles signalés avec l'allergène en cause et refusés côté serveur |
| Parent | Recharger le compte en ligne | Recharge Mobile Money simulée : Wave, MTN MoMo, Orange Money, Moov Money |
| Parent | Suivre ce que mange son enfant | Historique des repas servis avec plat, portion et heure |
| Parent | Alerte solde bas | Notification automatique sous 1 000 F et en cas de découvert |
| Admin | Planifier les menus à l'avance | Menus publiés jour par jour sur la semaine, avec stock prévu |
| Admin | Connaître le nombre de repas à préparer | Fiche cuisine en portions équivalentes, par plat et par vague |
| Admin | Gérer les stocks, éviter les ruptures | Stock décrémenté à chaque commande, plat « épuisé » bloqué, alerte allergènes |
| Admin | Générer des rapports d'activité | Statistiques du jour et du mois : commandé, servi, consommé, avis, recettes |

### Fonctionnalités bonus

| Bonus du guide | Statut | Détail |
|---|---|---|
| Système de notation des plats | Fait | Chaque assiette rendue est marquée appréciée ou non. Classement des plats par taux d'appréciation dans les statistiques |
| Suggestions personnalisées | Fait, sans IA générative | Suggestion de portion par élève à partir de ses 20 derniers repas (au moins 8 observations). Au delà de 85 % d'assiettes terminées, portion supérieure proposée ; sous 30 %, portion inférieure. L'admin valide ou refuse |
| Multi langue (français, anglais) | Fait | Sélecteur de langue dans le profil élève |
| Intégration paiement Mobile Money | Simulé | Parcours complet avec choix de l'opérateur, transaction « en attente » puis validée ou échouée, clé d'idempotence. Aucun opérateur réel n'est contacté |
| Notifications en temps réel | Partiel | Notifications dans l'application pour le parent : commande, repas servi, annulation, recharge, solde bas. Pas encore de push navigateur |
| Mode borne | Fait | Route `/borne` : connexion matricule et PIN, déconnexion automatique après la commande |
| Application mobile | Web mobile first | Interface conçue et vérifiée à 375 px de large. Pas d'APK natif |
| Mode hors ligne | Non fait | Prévu : vérification des tickets par la clé publique (déjà exposée sur `/public-key`) et appel enseignant hors connexion |

## 4. Les espaces de l'application

L'application compte six rôles. Chaque rôle a son propre espace, protégé côté serveur.

### 4.1 Élève (mode Commande)

Connexion sur `/login` avec le matricule et le PIN. Sur une tablette partagée, `/borne` déconnecte l'élève après chaque commande.

1. **Accueil.** Solde, repas du jour, état de sa réservation ou écran d'attente si les commandes ne sont pas ouvertes.
2. **Choix du plat** (`/reservation`). Photo, ingrédients, prix et stock restant. Les plats contenant un de ses allergènes sont affichés à part avec la raison (« Contient poisson (poisson braisé) ») et ne peuvent pas être commandés.
3. **Portion** (`/reservation/quantite`). Curseur à 3 crans, l'assiette dessinée se remplit, le prix suit la portion et s'arrondit à 25 F.
4. **Vague** (`/reservation/horaire`). Créneaux de 20 minutes avec places restantes. Le choix de la vague ouvre le jour même à partir de la récréation (10 h).
5. **Place** (`/reservation/place`). Plan de salle interactif, places prises grisées.
6. **Ticket.** QR code signé à présenter au comptoir. Annulation possible avant 10 h, avec remboursement automatique.
7. **Profil** (`/profil`). Allergies en lecture seule, historique des réservations et des transactions, choix de la langue.
8. **Menus à venir** (`/menus`). Menus de la semaine, compatibles ou non avec ses allergies.

### 4.2 Parent

Inscription et connexion sur `/pro`.

- **Rattacher un enfant** (`/parent/ajouter`) par son matricule, avec confirmation du nom et de la classe avant validation. Un parent peut rattacher plusieurs enfants.
- **Fiche enfant** (`/parent/enfant/:id`) : solde, historique des repas, déclaration des allergies. Le parent est le seul à pouvoir les modifier. Il active aussi l'accès élève (réinitialisation du PIN).
- **Recharge** (`/parent/paiements`) : choix de l'opérateur Mobile Money, numéro masqué, suivi des transactions.
- **Menu de la semaine** (`/parent/menu`) avec ingrédients et allergènes.
- **Notifications** (`/parent/notifications`) : commande passée, repas servi avec l'heure, annulation et remboursement, recharge validée, solde bas.

### 4.3 Cuisine

Deux cuisiniers de démo : l'un affecté au collège et au lycée (mode Commande), l'autre au primaire (mode Classe). Chacun ne voit que son périmètre.

- **Ingrédients** (`/cuisine/ingredients`) : base ingrédients liés à 9 allergènes (arachide, gluten, poisson, crustacés, œuf, lait, soja, fruits à coque, piment).
- **Plats** (`/cuisine/plats`) : création par les ingrédients et photo. Les allergènes sont déduits, avec le nombre et le pourcentage d'élèves concernés. Un plat peut être déclaré comme version sans allergène d'un autre.
- **Menus** (`/cuisine/menus`) : publication par jour, type (principal, sans allergène, accompagnement), prix et stock prévu.
- **Service du jour** (`/cuisine`) : couverts par vague en portions équivalentes, plateaux sans allergène nominatifs.
- **Salle** (`/cuisine/salle`) : qui est assis où, vague par vague.
- **Retours d'assiettes** (`/cuisine/retours`) : pour chaque élève, assiette terminée ou non, plat apprécié ou non. Ces saisies alimentent les statistiques et les suggestions de portion.
- **Statistiques** (`/cuisine/statistiques`) : consommation et appréciation par plat.

### 4.4 Agent de comptoir

- **Comptoir** (`/comptoir`) : scan du ticket QR à la caméra. L'écran affiche le nom, le plat, la portion, la vague et la place, ou une alerte claire si le ticket est faux, déjà servi, d'un autre jour ou hors de sa vague. Le scan passe la commande à « servie » et notifie le parent.

### 4.5 Enseignant (mode Classe)

- **Appel** (`/enseignant`) : liste de la classe, élèves allergiques mis en évidence avec leur allergène. L'enseignant valide la classe d'un geste puis décoche les absents. Les absents sont retirés des couverts de la cuisine.

### 4.6 Administration

- **Tableau de bord** (`/admin`) : la journée en cours, commandes, servis, recettes, affluence par vague.
- **Statistiques** (`/admin/statistiques`) : jour et mois, trois notions jamais mélangées (commandé, servi, consommé), classement des plats par appréciation, classement des élèves.
- **Élèves et classes** (`/admin/eleves`) : création et modification. Les allergies ne sont jamais modifiables ici, elles relèvent du parent.
- **Vagues** (`/admin/creneaux`) : créneaux par date, horaires et capacité.
- **Salle** (`/admin/salle`) : plan des tables et des places, places PMR.
- **Portions** (`/admin/portions`) : validation ou refus des suggestions de portion.
- **Paramètres** (`/admin/parametres`) : mode par niveau, heures d'ouverture et de clôture des commandes, découvert autorisé, délai de préparation, heure de récréation, affectation des cuisiniers, heure de passage des classes.

## 5. Règles de gestion

Toutes ces règles sont vérifiées **côté serveur**, l'interface ne fait que les refléter.

| Règle | Détail |
|---|---|
| Montants | Entiers en FCFA |
| Prix d'une commande | Prix du plat × portion (1/3, 2/3 ou 3/3), arrondi au multiple de 25 F supérieur |
| Une commande par jour | Un élève ne peut avoir qu'une réservation active par jour de repas |
| Fenêtre de commande | Ouverture la veille à 18 h. Le jour même, commande possible jusqu'à l'heure limite de la dernière vague (début de la vague moins le délai de préparation, 60 min par défaut) |
| Choix de la vague | Le jour même uniquement, à partir de la récréation |
| Annulation | Remboursée uniquement avant la clôture (10 h) |
| Découvert | Le solde peut descendre jusqu'à moins 1 500 F (paramétrable). Avec un solde négatif, aucune nouvelle commande |
| Allergies | Un plat contenant un allergène déclaré n'est ni proposé ni accepté. Seul le parent modifie les allergies |
| Capacité | Une vague n'accepte pas plus d'élèves que sa capacité. Une place n'est attribuée qu'une fois par vague |
| Ticket | Servi une seule fois. Contrôle de la vague au comptoir activable (`COMPTOIR_CONTROLE_CRENEAU`) |
| Paiement | Le solde n'est crédité qu'une seule fois par transaction (clé d'idempotence) |
| Suggestions de portion | Jamais appliquées automatiquement. Une suggestion refusée n'est pas reproposée pendant 14 jours |

## 6. Architecture technique

```
┌──────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│  Frontend React (Vite)   │  ───────────────────────▶  │  API FastAPI (Python)    │
│  Tailwind, mobile first  │        JWT Bearer          │  Routers par rôle        │
│  QR : qrcode.react       │  ◀───────────────────────  │  Services métier         │
│  Scan : html5-qrcode     │                            │  Signature Ed25519       │
└──────────────────────────┘                            └────────────┬─────────────┘
                                                                     │ SQLAlchemy 2
                                                                     ▼
                                                        ┌──────────────────────────┐
                                                        │  PostgreSQL              │
                                                        │  Migrations Alembic      │
                                                        └──────────────────────────┘
```

| Couche | Technologies |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, lucide-react, qrcode.react, html5-qrcode |
| Backend | Python 3, FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, PyJWT, pwdlib (bcrypt), cryptography (Ed25519) |
| Base de données | PostgreSQL |
| Documentation API | Swagger généré automatiquement sur `/docs` |

**Choix d'architecture.**

- **Routers fins, services épais.** Les routes (`backend/app/routers`) lisent la requête et l'identité. Toute la logique métier vit dans `backend/app/services`, testable indépendamment.
- **Une transaction par commande.** La création d'une réservation verrouille l'élève, le menu, la vague et la place, puis vérifie fenêtre, allergènes, stock, capacité, place, solde et doublon avant de débiter. Les erreurs métier remontent en HTTP 409 avec un message en français.
- **Identité issue du token uniquement.** Un élève ne peut jamais agir pour un autre, un parent n'accède qu'à ses enfants.
- **Deux modes, jamais mélangés.** Le service cuisine calcule les couverts soit à partir des réservations (mode Commande), soit à partir de l'effectif moins les absents de l'appel (mode Classe).

## 7. Structure du dépôt

```
cantine-vatel/
├── backend/
│   ├── alembic/                 Migrations de la base
│   ├── app/
│   │   ├── main.py              Application FastAPI, CORS, routes /health et /public-key
│   │   ├── config.py            Variables d'environnement
│   │   ├── deps.py              Authentification et contrôle des rôles
│   │   ├── models/              Tables SQLAlchemy
│   │   ├── schemas/             Schémas Pydantic d'entrée et de sortie
│   │   ├── routers/             auth, eleve, parent, cuisine, agent, enseignant, admin
│   │   ├── services/            Réservations, tickets, paiement, cuisine, statistiques...
│   │   ├── seed.py              Données de démonstration complètes (efface et recrée)
│   │   └── seed_tests.py        Ajout de menus commandables sans rien effacer
│   ├── static/                  Photos des plats envoyées par la cuisine
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/                  Logo et favicon
│   └── src/
│       ├── api/                 Client Axios et appels par espace
│       ├── components/          Composants partagés (assiette, plan de salle, recharge...)
│       ├── hooks/               Authentification, parcours de réservation
│       ├── pages/               eleve, parent, cuisine, agent, enseignant, admin, pro
│       └── utils/               Format FCFA, traductions, jetons de design
└── docs/
    ├── 1_PROCESSUS.md           Description détaillée des parcours
    └── 2_CAHIER_DES_CHARGES.md  Exigences, règles et priorités
```

## 8. Modèle de données

| Table | Rôle |
|---|---|
| `users` | Comptes du personnel et des parents : admin, cuisine, agent, enseignant, parent |
| `niveaux` | Primaire, collège, lycée, avec leur mode (classe ou commande) |
| `classes` | Classes, enseignant référent, heure de passage |
| `eleves` | Matricule, PIN haché, classe, parent, allergies, solde, portion par défaut |
| `allergenes`, `ingredients`, `ingredient_allergene` | Base de connaissances ingrédients et allergènes |
| `plats`, `plat_ingredient` | Plats, photo, prix, lien vers la version sans allergène |
| `menu_jour` | Plat proposé un jour donné : type, prix, stock prévu et restant |
| `creneaux` | Vagues de passage : date, horaires, capacité |
| `tables`, `places` | Plan de salle, places PMR |
| `reservations` | Commande d'un élève : plat, portion, prix, vague, place, statut |
| `appels`, `presences` | Appel de l'enseignant en mode Classe |
| `repas` | Repas réellement servi, consommation et avis |
| `suggestions_portion` | Suggestions de portion à valider par l'administration |
| `transactions` | Recharges, débits, remboursements, statut et opérateur |
| `notifications` | Messages destinés aux parents |
| `parametres` | Réglages de la cantine |
| `affectations_cuisine`, `classe_tables` | Périmètre des cuisiniers, tables réservées aux classes |

Les stocks sont exprimés en tiers de portion : 3 tiers font une portion pleine. La cuisine voit donc directement les portions équivalentes à préparer.

## 9. Sécurité et intégrité

- Mots de passe et PIN hachés avec bcrypt.
- Authentification par jeton JWT, contrôle du rôle sur chaque route côté serveur.
- Tickets signés Ed25519 avec une clé privée hors du dépôt (`TICKET_SIGNING_KEY`). La clé publique est exposée sur `/public-key` pour une vérification hors ligne future.
- Verrouillage des lignes (`SELECT ... FOR UPDATE`) sur la création d'une réservation : pas de double débit, pas de place vendue deux fois, pas de stock négatif.
- Contrainte d'unicité en base sur la place par vague, en dernier rempart.
- Allergies et solde jamais modifiables par l'élève.
- Secrets dans `backend/.env`, ignoré par Git. CORS restreint aux origines déclarées.
- Développement uniquement sur des données fictives.

## 10. Installation et lancement en local

### Prérequis

- Python 3.12 ou plus récent
- Node.js 20 ou plus récent
- PostgreSQL 14 ou plus récent

### 1. Base de données

```bash
createuser cantine --pwprompt
```

Saisir `cantine` comme mot de passe, puis :

```bash
createdb cantine --owner cantine
```

### 2. Backend

```bash
cd backend
```

```bash
python3 -m venv .venv
```

```bash
.venv/bin/pip install -r requirements.txt
```

```bash
cp .env.example .env
```

Dans `.env`, renseigner `JWT_SECRET` avec une valeur aléatoire. `TICKET_SIGNING_KEY` peut rester vide en développement : une clé est alors générée en mémoire, mais les tickets deviennent invalides à chaque redémarrage. Pour une clé stable, générer la clé avec la commande indiquée en commentaire dans `.env.example`.

| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql+psycopg://cantine:cantine@localhost:5432/cantine` |
| `JWT_SECRET` | Signature des jetons de connexion | à définir |
| `CORS_ORIGINS` | Origines autorisées | `http://localhost:5173` |
| `TICKET_SIGNING_KEY` | Clé privée Ed25519 au format PEM | vide (clé éphémère) |
| `COMPTOIR_CONTROLE_CRENEAU` | Refuser un ticket hors de sa vague | `true` |

Créer les tables puis charger les données de démonstration :

```bash
.venv/bin/alembic upgrade head
```

```bash
.venv/bin/python -m app.seed
```

Lancer l'API :

```bash
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

Dans un second terminal, depuis la racine du projet :

```bash
cd frontend
```

```bash
npm install
```

```bash
npm run dev
```

L'application est disponible sur http://localhost:5173 et l'API sur http://localhost:8000. Le frontend appelle l'API sur `http://localhost:8000` (fichier `frontend/src/api/client.js`).

### 4. Données de test pour une session avec des élèves

`app.seed` **efface toute la base** et recrée les données de démonstration, avec un menu pour le jour même. Pour préparer une séance de tests sans rien effacer :

```bash
cd backend && .venv/bin/python -m app.seed_tests --recharger
```

Ce script publie des menus variés (deux plats principaux, une version sans allergène et un accompagnement) pour aujourd'hui et les sept jours suivants, crée les vagues de passage (jusqu'à 22 h le jour même pour pouvoir commander à toute heure) et remet à 10 000 F le solde des élèves qui ont moins de 5 000 F. Il peut être relancé sans risque : il ne crée aucun doublon et complète les stocks entamés.

### Installer l'application sur un appareil (PWA)

Cantine Vatel est une application web installable : pas de store, l'application s'installe depuis le navigateur et s'ouvre ensuite en plein écran. La page **Découvrir** (`/decouvrir`) s'affiche en premier dans le navigateur et détaille ces étapes avec des illustrations ; une fois l'application installée, elle s'ouvre directement sur l'espace de l'utilisateur.

| Appareil | Navigateur | Étapes |
|---|---|---|
| iPhone, iPad | Safari | Bouton **Partager**, puis **Sur l'écran d'accueil**, puis **Ajouter** |
| Android | Chrome | Menu **⋮** en haut à droite, puis **Installer l'application** (ou **Ajouter à l'écran d'accueil**) |
| Windows, Linux, Chromebook | Chrome ou Edge | Icône d'installation à droite de la barre d'adresse, puis **Installer** |
| Mac | Safari 17 ou plus | **Partager** (ou menu **Fichier**), puis **Ajouter au Dock** |

Sur Android et ordinateur, le bouton **Installer l'application** de la page Découvrir déclenche directement l'installation quand le navigateur le permet. L'installation demande un site servi en HTTPS (ou `localhost`).

## 11. Comptes de démonstration

Mot de passe commun du personnel et des parents : **`motdepasse`**. Connexion sur `/pro`.

En ligne (Render), ces comptes sont créés automatiquement au démarrage de l'API grâce à la variable `SEED_DEMO=true`, à condition que la base ne contienne encore aucun compte. Une base déjà utilisée n'est jamais effacée.

| Rôle | Identifiant | Ce qu'on y voit |
|---|---|---|
| Administration | `admin@demo.ci` | Tableau de bord, statistiques, paramètres |
| Cuisine collège et lycée | `cuisine@demo.ci` | Service en mode Commande |
| Cuisine primaire | `cuisine.primaire@demo.ci` | Service en mode Classe |
| Agent de comptoir | `agent@demo.ci` | Scan des tickets |
| Enseignant (CM2 A) | `enseignant@demo.ci` | Appel de la classe |
| Parent d'Awa | `parent.awa@demo.ci` | Recharge, historique, notifications |
| Parent de Kouadio | `parent.kouadio@demo.ci` | Second profil parent |

Élèves du lycée (mode Commande), connexion sur `/login` ou `/borne`, PIN **`1234`** :

| Matricule | Élève | Particularité |
|---|---|---|
| `12026001L` | Awa Coulibaly | Allergique à l'arachide, a déjà une commande et un historique |
| `12026002L` | Kouadio Yao | Allergique au poisson |
| `12026003L` | Aya Traoré | Sans allergie |

Les élèves du primaire (matricules en `P`) fonctionnent en mode Classe : ils ne commandent pas, l'enseignant fait l'appel.

## 12. Scénario de démo conseillé

Une histoire en dix minutes qui traverse tous les rôles :

1. **Cuisine.** Créer un plat à partir de ses ingrédients : les allergènes apparaissent seuls, avec le nombre d'élèves concernés. Le publier au menu.
2. **Parent.** Recharger le compte d'Awa par Wave, voir la notification de recharge validée.
3. **Élève.** Kouadio se connecte : le plat au poisson est signalé comme incompatible. Il choisit un autre plat, une portion de 2/3 sur l'assiette, une vague et une place. Le ticket QR s'affiche.
4. **Comptoir.** L'agent scanne le ticket : la fiche s'affiche en vert. Un second scan du même ticket est refusé.
5. **Parent.** Le parent reçoit « Kouadio a déjeuné à 12 h 48 ».
6. **Enseignant.** Appel du CM2 A en deux gestes, élèves allergiques en évidence.
7. **Cuisine.** Saisie des retours d'assiettes, puis service du jour en portions équivalentes.
8. **Administration.** Tableau de bord et statistiques : commandé, servi, consommé, plats les plus appréciés, suggestion de portion à valider.

## 13. Documentation de l'API

L'API est documentée automatiquement par FastAPI :

- Swagger : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc

| Préfixe | Rôle | Principales routes |
|---|---|---|
| `/auth` | Public | `POST /login` (élève), `POST /pin`, `POST /user/login`, `POST /parent/register` |
| `/eleve` | Élève | `GET /me`, `GET /menu-du-jour`, `GET /menus`, `GET /creneaux`, `GET /salle`, `POST /reservations`, `PUT /reservations/{id}/vague`, `GET /reservation-du-jour`, `GET /historique`, `DELETE /reservations/{id}` |
| `/parent` | Parent | `GET /enfants`, `GET /enfants/verifier`, `POST /enfants`, `PUT /enfants/{id}/allergies`, `POST /enfants/{id}/acces`, `POST /recharges`, `POST /recharges/{ref}/traiter`, `GET /recharges`, `GET /enfants/{id}/historique`, `GET /menu`, `GET /notifications` |
| `/cuisine` | Cuisine | `GET POST /ingredients`, `GET POST /plats`, `GET POST PUT DELETE /menus`, `GET /fiche`, `GET /service`, `GET /vagues/{cle}`, `GET /salle`, `PUT /retours`, `GET /statistiques` |
| `/agent` | Comptoir | `POST /servir`, `GET /service-du-jour` |
| `/enseignant` | Enseignant | `GET /classes`, `GET POST /classes/{id}/appel` |
| `/admin` | Administration | `GET PUT /parametres`, `/niveaux`, `/creneaux`, `/salle`, `/tables`, `/places`, `GET /dashboard`, `GET /aujourdhui`, `GET /statistiques`, `/scolarite/classes`, `/scolarite/eleves`, `/cuisiniers`, `/suggestions-portion` |
| Racine | Public | `GET /health`, `GET /public-key` |

## 14. Direction artistique

Une identité **premium et éditoriale**, chaleureuse et minimaliste, pensée d'abord pour le téléphone.

| Élément | Choix |
|---|---|
| Titres | Space Grotesk, expressifs et affirmés |
| Texte d'interface | Inter |
| Couleurs | Blanc dominant `#FFFFFF`, noir doux `#222222` pour les actions, corail signature `#FF5A5F` pour les accents et sélections, rose poudré `#FFF0ED` pour les surfaces secondaires, gris `#717171` et `#B0B0B0` pour la hiérarchie, rouge `#B30000` pour les alertes |
| Photos | Grandes photographies culinaires, rayons de 22 px |
| Composition | Une mise en page propre à chaque écran, cartes plates, espaces blancs intentionnels, aucun tableau de bord générique |
| Accessibilité | Gros boutons, contrastes élevés, libellés en français simple, vérification systématique à 375 px |

## 15. Limites connues et suite du projet

Ce qui fonctionne aujourd'hui est décrit plus haut. Ce qui reste à faire, en toute transparence :

| Sujet | État actuel | Prochaine étape |
|---|---|---|
| Paiement | Simulé de bout en bout | Brancher un agrégateur agréé (CinetPay ou Wave Business) avec vérification du webhook auprès de l'API |
| Hors ligne | Non disponible | PWA : vérification locale des tickets avec la clé publique, appel enseignant stocké sur le téléphone puis synchronisé |
| Notifications | Dans l'application | Notifications push et SMS au parent |
| Abonnement mensuel (mode Classe) | Non disponible | Souscription, période de grâce et rappels de renouvellement |
| Absence signalée par le parent | Non disponible | Signalement avant 9 h, retiré de la fiche cuisine |
| Anti gaspi | Non disponible | Portions restantes à moitié prix après le service |
| Propreté des tables | Non disponible | État des tables saisi par l'agent après chaque vague |
| Déploiement | Local | API et base sur VPS avec Docker Compose et HTTPS, frontend sur Vercel |
| Adresse de l'API | Fixée à `localhost:8000` dans le frontend | Variable d'environnement Vite pour la mise en ligne |

## 16. Livrables

| Livrable | Lien |
|---|---|
| Dépôt Git | https://github.com/dagbokady/cantine-vatel |
| Démo en ligne | à compléter |
| README | ce fichier |
| Pitch deck | envoyé par mail avant le passage (23 au 25 novembre 2026) |

Documents de conception : [Description des processus](docs/1_PROCESSUS.md) et [Cahier des charges](docs/2_CAHIER_DES_CHARGES.md).

---

<p align="center">Projet réalisé pour le Hackathon Cantine Vatel 2026.</p>
