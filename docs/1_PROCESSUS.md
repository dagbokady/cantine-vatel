# Cantine Vatel — Description des processus

Plateforme de gestion de cantine pour un établissement scolaire qui accueille primaire, collège et lycée. Un seul système, deux modes de fonctionnement choisis par l'établissement pour chaque niveau.

| | Mode Classe (primaire) | Mode Commande (collège, lycée) |
|---|---|---|
| Qui paie | Le parent, abonnement mensuel | Le parent recharge un crédit ; l'élève le dépense en commandant |
| Qui choisit le repas | Personne : l'élève abonné est inscrit chaque jour ouvré | L'élève, sur son téléphone ou sur la borne de l'école |
| Portion | Standard | Choisie par l'élève : ¼, ½, ¾ ou 1, prix proportionnel |
| Passage | Créneau par classe ou par niveau | Créneau individuel de 15 à 20 minutes et place choisie |
| Présence | Appel fait par l'enseignant | Scan du ticket QR au comptoir |
| Allergies | Élève en rouge, plat sans allergène servi d'office | Plats incompatibles non proposés, refusés par le serveur |
| Sans connexion | Appel enregistré sur le téléphone, synchronisé ensuite | Ticket vérifié par signature, synchronisé ensuite |

L'établissement peut basculer un niveau d'un mode à l'autre (un collège en mode Classe, par exemple) dans ses paramètres.

## 1. Acteurs

| Rôle | Responsabilités |
|---|---|
| Admin établissement | Crée classes et élèves, configure la cantine, le plan de salle, les créneaux, les prix, les modes par niveau ; valide les remboursements ; consulte le tableau de bord |
| Cuisine | Gère la base d'ingrédients, crée les plats, publie les menus, prépare selon la fiche cuisine |
| Agent de comptoir | Sert, scanne les tickets, coche les plateaux sans allergène remis, signale l'état des tables |
| Enseignant | Fait l'appel de sa classe pendant le créneau (mode Classe), veille aux élèves en rouge |
| Parent | Se rattache à son enfant, déclare ses allergies, paie, suit tout ce que mange l'enfant |
| Élève | En mode Commande : commande son repas, choisit portion et place, présente son ticket |

## 2. Socle commun

### 2.1 Mise en place par l'établissement

1. L'admin crée l'établissement, les niveaux, les classes et leur enseignant référent.
2. Il importe les élèves : matricule, nom, classe, photo si disponible.
3. Il crée les comptes enseignants et agents.
4. Il configure la cantine : mode par niveau, créneaux et capacités, plan de salle (tables et places), prix de l'abonnement, prix des plats, heures d'ouverture et de clôture des commandes, durée de la période de grâce, découvert autorisé.

### 2.2 Rattachement du parent

1. Le parent crée son compte.
2. Il saisit le matricule de son enfant ; le système affiche nom et classe pour confirmation, puis rattache l'enfant. Un parent peut rattacher plusieurs enfants.
3. Il déclare les allergies et le régime. Lui seul peut les modifier.
4. Pour un élève en mode Commande, il active l'accès élève ; l'élève choisit un code PIN à 4 chiffres à la première connexion.

### 2.3 Base de connaissances ingrédients-allergènes

Base déterministe, sans IA, enrichie par l'établissement. Chaque ingrédient est lié à zéro ou plusieurs allergènes (pâte d'arachide → arachide ; poisson fumé → poisson ; farine de blé → gluten).

1. La cuisine crée un plat en saisissant ses ingrédients et prend sa photo elle-même.
2. Le système déduit les allergènes du plat.
3. Il affiche le nombre et le pourcentage d'élèves concernés : « 9 élèves (4 %) ne peuvent pas manger ce plat ».
4. La cuisine prévoit le plat sans allergène en quantité exacte.

Chaque jour comporte un plat principal et sa version sans allergène. Les parents voient ingrédients et allergènes dans le menu de la semaine et dans l'historique de ce que l'enfant a réellement mangé.

### 2.4 Paiement

L'argent ne transite jamais par la plateforme. Il arrive sur le compte marchand de l'établissement via un agrégateur agréé (CinetPay, qui couvre Wave, Orange Money, MTN et Moov, ou Wave Business).

1. Le parent lance un paiement (abonnement ou recharge).
2. Le backend crée une transaction « en attente » avec un identifiant unique et demande un lien de paiement à l'agrégateur.
3. Le parent paie sur son téléphone.
4. L'agrégateur appelle le webhook ; le backend vérifie le statut et le montant auprès de l'API de l'agrégateur avant de valider.
5. La validation est idempotente : un webhook reçu deux fois ne crédite qu'une fois.

La plateforme tient le registre : abonnement actif ou avoir cantine dû par l'établissement. Un retrait est une demande de remboursement validée et exécutée par l'établissement. Le statut juridique de l'avoir est à valider avec l'agrégateur ou un juriste avant un lancement réel. Pendant le hackathon, les paiements sont simulés.

## 3. Mode Classe (primaire)

### 3.1 Abonnement mensuel

1. Le parent souscrit l'abonnement du mois ; l'enfant est inscrit pour tous les jours ouvrés.
2. Rappel de renouvellement quelques jours avant la fin du mois.
3. Oubli : période de grâce. L'enfant reste dans les effectifs le premier jour de cantine du mois, statut « en attente de paiement », badge orange sur la liste de l'enseignant, rappel urgent au parent. Le repas est ajouté à l'abonnement suivant. Sans paiement à la fin de la grâce, l'enfant sort des effectifs.

### 3.2 Le matin

1. Avant 9 h, le parent peut signaler une absence.
2. À 9 h, la fiche cuisine se fige : abonnés moins absences, répartis entre plat principal et sans allergène, par classe, avec la liste nominative des plateaux sans allergène (nom, photo, classe).

### 3.3 Le service

1. Chaque classe passe à son créneau, fixé par l'établissement selon la capacité de la salle.
2. L'enseignant ouvre la liste de sa classe : photos, élèves allergiques en rouge avec l'allergène.
3. Il valide la classe d'un geste puis décoche les absents.
4. Triple contrôle des allergies : plateaux sans allergène préparés à part et étiquetés en cuisine ; l'agent remet chaque plateau étiqueté et le coche ; l'enseignant confirme. Alerte en cas de divergence.
5. Chaque parent reçoit : « Awa a déjeuné à 12 h 05 : riz sauce graine, version sans arachide » ou « Awa est absente de la cantine aujourd'hui ».

### 3.4 Sans connexion

1. Au chargement de la liste le matin, elle est enregistrée sur le téléphone de l'enseignant.
2. L'appel se fait hors ligne et est stocké localement.
3. Au retour de la connexion, l'appel est envoyé ; les notifications aux parents partent à ce moment.

## 4. Mode Commande (collège, lycée)

### 4.1 Crédit

1. Le parent recharge le crédit de son enfant. L'élève n'a jamais d'argent en main : payer, pour lui, c'est commander.
2. Le solde peut descendre jusqu'à moins le prix d'un plat, pour qu'un élève à zéro mange quand même. Tant que le solde est négatif, aucune nouvelle commande ; le parent est prévenu.
3. Alerte au parent quand le solde passe sous un seuil.

### 4.2 Fenêtre de commande

1. Ouverture la veille au soir.
2. Clôture principale à 10 h : la fiche cuisine se fige.
3. Après 10 h et jusqu'au créneau, commande encore possible dans la limite des portions restantes.

### 4.3 Commander, sur téléphone ou sur la borne

1. Connexion : sur téléphone, matricule et PIN ; sur la borne de l'école, matricule puis PIN, avec déconnexion automatique après chaque commande.
2. Plats : seuls les plats compatibles avec ses allergies sont proposés, avec photo, ingrédients et prix.
3. Portion : une assiette dessinée se remplit selon le cran choisi sur un curseur à 4 paliers (Petite faim ¼, Moitié ½, Normal ¾, Grande faim 1). Le prix suit la portion. Principe d'équité : chacun prend ce qu'il mangera.
4. Place : plan de la salle ; l'élève choisit un créneau puis une place libre.
5. Confirmation : le serveur vérifie, dans une seule transaction, la fenêtre de commande, l'absence d'allergène, le stock, la capacité du créneau, la place, le solde et l'absence d'autre commande le même jour. Il débite, décrémente le stock et réserve la place.
6. Ticket : QR signé par le serveur (Ed25519) contenant commande, élève, date, créneau, place, plat et portion.
7. Annulation possible avant 10 h, avec remboursement.

### 4.4 Fiche cuisine

À 10 h : portions équivalentes par plat et par créneau (exemple : 212 commandes = 168,5 portions, soit environ 34 kg de riz), marge de 5 %, plateaux sans allergène nominatifs.

### 4.5 Le service

1. L'élève se présente à son créneau et montre son ticket.
2. L'agent scanne : photo, nom, plat, portion, place, alerte rouge s'il y a un problème.
3. L'agent sert la portion commandée ; la commande passe à « servie ».
4. L'élève s'installe à sa place.

### 4.6 Sans connexion

1. À l'ouverture, la tablette du comptoir télécharge la clé publique du serveur et les commandes du jour.
2. Au scan, elle vérifie la signature, la date, le créneau et que le ticket n'a pas déjà servi.
3. Le service est enregistré localement puis synchronisé.
4. La borne ne prend pas de commande hors ligne : un élève sans commande va en file normale ; l'agent enregistre sa consommation sur la tablette, débitée à la synchronisation (le découvert d'un plat couvre ce cas).

Pas de double dépense, puisque le paiement a lieu à la commande ; un QR copié ne sert qu'une fois ; un faux QR est rejeté.

### 4.7 Propreté des tables

1. Le système sait qui occupait chaque place à chaque créneau.
2. Après chaque créneau, l'agent marque les tables « propre » ou « à nettoyer ».
3. Une table laissée sale est rattachée aux élèves qui l'occupaient.

### 4.8 Après le service

1. Une commande non consommée après 10 h n'est pas remboursée.
2. Les portions restantes passent en anti-gaspi à moitié prix pour élèves et personnel.
3. Notifications au parent : commande passée, repas servi avec l'heure, solde bas, découvert utilisé.

## 5. Tableau de bord de l'établissement

Portions préparées, servies, restantes et sauvées ; taux de gaspillage du jour et de la semaine ; présence par classe ; affluence par créneau ; occupation de la salle ; recettes ; répartition des allergies ; tables signalées.
