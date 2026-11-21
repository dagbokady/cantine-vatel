# Cantine Vatel

Application web mobile-first (PWA) de gestion de cantine scolaire. Hackathon de 10 heures, développeur unique.
Références : docs/1_PROCESSUS.md, docs/2_CAHIER_DES_CHARGES.md, docs/DESIGN.md.
Phase en cours : PARCOURS LYCÉEN UNIQUEMENT. Ne construis aucun autre écran (parent, enseignant, cuisine, admin) tant que je ne le demande pas. Les données des autres rôles viennent du seed.

## Stack
- backend/ : FastAPI, SQLAlchemy 2 (style 2.0, typé), Alembic, Pydantic v2, PostgreSQL, pwdlib[bcrypt], PyJWT, cryptography (Ed25519).
- frontend/ : React + Vite + Tailwind v4, react-router-dom, axios, qrcode.react, lucide-react.
- Structure backend : app/main.py, config.py, db.py, deps.py, seed.py, models/, schemas/, routers/, services/.
- Structure frontend : src/api, src/components, src/pages/eleve, src/hooks, src/utils.

## Règles de code
- Une étape à la fois : plan court, puis code, puis arrêt pour que je teste.
- Routes fines, logique métier dans services/.
- Réservation, débit, stock, créneau et place : une seule transaction avec SELECT ... FOR UPDATE. Erreur métier → HTTP 409 avec un message en français.
- Identité toujours issue du JWT. Un élève n'accède qu'à ses propres données.
- Allergies vérifiées côté serveur. L'élève peut voir ses allergies, jamais les modifier (c'est le parent).
- Montants en entiers FCFA. Portions : 1/3, 2/3, 3/3 (stockées en tiers : 1, 2, 3). Prix = prix du plat × tiers / 3, arrondi à 25 FCFA.
- Secrets dans .env, .env.example commité, CORS limité à la config.
- Paiements simulés uniquement.

## Design (résumé de docs/DESIGN.md, adapté au mobile)
- Fond blanc #ffffff ; surfaces douces #eeece7 (soft stone) ; bandeaux forts en vert profond #003c33 avec texte blanc.
- Texte principal #212121 ; texte secondaire #616161 ; métadonnées #93939f ; filets #d9d9dd.
- Bouton principal : pilule #17171c, texte blanc, 14–16 px, padding 12px 24px, rayon 32px, pleine largeur en bas d'écran.
- Accent chaud #ff7759 (coral) pour les petits marqueurs uniquement. Alerte allergie / erreur #b30000.
- Polices : Space Grotesk pour les grands titres (serrés, letter-spacing négatif), Inter pour l'interface. Charger depuis Google Fonts.
- Cartes plates, sans ombre, rayon 22px pour les photos de plats, 8–16px pour le reste, bordure #f2f2f2 au besoin.
- Un seul grand titre par écran, le reste en 16–18 px. Beaucoup d'espace blanc. Pas de dégradé dans l'interface.
- Zones tactiles de 48 px minimum. Écran pensé pour 375 px de large.