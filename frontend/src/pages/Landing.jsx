import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  BarChart3,
  ChefHat,
  Check,
  Clock3,
  KeyRound,
  Leaf,
  Monitor,
  Plus,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";
import { APP_LOGO, APP_NAME } from "../config/app";
import BoutonInstaller from "../pwa/BoutonInstaller";
import { Siege } from "../components/eleve/PlanSalle";

const titre = { fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" };
const COURBE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const PHOTO_ATTIEKE = "https://commons.wikimedia.org/wiki/Special:FilePath/Atti%C3%A9k%C3%A9%20et%20poisson.jpg?width=1000";
const PHOTO_RIZ = "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&q=70&auto=format";

const LIENS = [
  { href: "#presentation", label: "Présentation" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#ecoles", label: "Pour les écoles" },
];

// Apparition unique à l'entrée dans l'écran (IntersectionObserver, jamais d'écouteur de scroll).
function useRevele() {
  useEffect(() => {
    const els = document.querySelectorAll(".revele");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("visible"));
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entrees) =>
        entrees.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);
}

function Navigation() {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    if (!ouvert) return undefined;
    const t = (e) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", t);
    return () => document.removeEventListener("keydown", t);
  }, [ouvert]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-[calc(12px+env(safe-area-inset-top))]">
        <nav aria-label="Navigation principale"
          className="mx-auto flex max-w-[1040px] items-center gap-2 rounded-full border border-[#EBEBEB] bg-white/80 py-2 pl-4 pr-2 backdrop-blur-xl">
          <a href="#haut" className="flex min-h-10 items-center gap-2 rounded-full pr-2 focus-visible:outline-2 focus-visible:outline-[#FF5A5F]">
            <img src={APP_LOGO} alt="" className="h-8 w-8" />
            <span className="text-sm font-semibold text-[#222222]">{APP_NAME}</span>
          </a>
          <ul className="ml-auto hidden items-center gap-1 md:flex">
            {LIENS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-[#717171] transition-colors duration-300 hover:bg-[#F7F7F7] hover:text-[#222222]">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#essayer"
            className={`ml-auto flex min-h-10 items-center rounded-full bg-[#222222] px-4 text-sm font-semibold text-white transition duration-300 ${COURBE} hover:bg-black active:scale-[0.98] md:ml-2`}>
            Essayer
          </a>
          <button type="button" onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-controls="menu-mobile"
            aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#F7F7F7] md:hidden">
            <span className={`absolute h-0.5 w-4 rounded-full bg-[#222222] transition-transform duration-500 ${COURBE} ${ouvert ? "rotate-45" : "-translate-y-1"}`} />
            <span className={`absolute h-0.5 w-4 rounded-full bg-[#222222] transition-transform duration-500 ${COURBE} ${ouvert ? "-rotate-45" : "translate-y-1"}`} />
          </button>
        </nav>
      </header>
      <div id="menu-mobile" hidden={!ouvert}
        className="fixed inset-0 z-40 bg-white/95 px-6 pt-[calc(96px+env(safe-area-inset-top))] backdrop-blur-2xl md:hidden">
        <ul className="space-y-2">
          {[...LIENS, { href: "#essayer", label: "Essayer" }].map((l, i) => (
            <li key={l.href} style={{ animation: ouvert ? `monte 500ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms both` : undefined }}>
              <a href={l.href} onClick={() => setOuvert(false)} className="flex min-h-14 items-center text-3xl font-semibold text-[#222222]" style={titre}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

// Visuel du hero : photo du plat, ticket de l'élève et composition, en léger mouvement.
function VisuelHero() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] pb-16 lg:pb-0">
      <div className="overflow-hidden rounded-[22px] bg-[#F7F7F7]">
        <img src={PHOTO_ATTIEKE} alt="Assiette d'attiéké et poisson braisé" className="aspect-[4/5] w-full object-cover" fetchPriority="high" />
      </div>

      <div className="flotte absolute -left-2 bottom-0 w-[60%] max-w-[260px] rounded-[22px] border border-[#EBEBEB] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,34,0.14)] sm:-left-8 lg:bottom-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">C'est réservé</p>
        <QRCodeSVG value="Cantine Vatel · ticket de démonstration" size={160} level="M" aria-hidden="true"
          className="mt-3 h-auto w-full" bgColor="#FFFFFF" fgColor="#222222" />
        <p className="mt-3 text-xs text-[#717171]">Code de secours</p>
        <p className="font-mono text-2xl font-semibold tracking-[0.18em] text-[#222222]">A7K9P2</p>
      </div>

      <div className="flotte-lent absolute -right-2 top-8 w-[46%] max-w-[210px] rounded-[22px] bg-white p-4 shadow-[0_24px_60px_rgba(34,34,34,0.14)] sm:-right-8">
        <p className="text-xs text-[#717171]">Ta place</p>
        <svg viewBox="-80 -80 160 160" className="mx-auto my-1 w-24" aria-hidden="true">
          <circle r="31" fill="#FFF0ED" stroke="#FF5A5F" strokeWidth="1.5" />
          <text y="6" textAnchor="middle" fontSize="17" fontWeight="700" fill="#222222" fontFamily="'Space Grotesk', sans-serif">T2</text>
          {[0, 60, 120, 180, 240, 300].map((d, i) => (
            <g key={d} transform={`translate(${52 * Math.cos((d * Math.PI) / 180)} ${52 * Math.sin((d * Math.PI) / 180)})`}>
              <Siege etat={i === 3 ? "sel" : "prise"} rot={d + 90} />
            </g>
          ))}
        </svg>
        <p className="text-center text-sm font-semibold text-[#222222]">Table T2 · Place 04</p>
      </div>
    </div>
  );
}

function Tagline() {
  const ref = useRef(null);
  const lignes = [
    ["Moins", "de", "files", "au", "comptoir."],
    ["Moins", "d'assiettes", "jetées."],
    ["Plus", "de", "temps", "pour", "bien", "manger."],
  ];
  useEffect(() => {
    const mots = ref.current?.querySelectorAll(".mot") ?? [];
    if (!("IntersectionObserver" in window)) {
      mots.forEach((m) => m.classList.add("actif"));
      return undefined;
    }
    // Chaque mot s'allume en franchissant une ligne située aux deux tiers de l'écran.
    const obs = new IntersectionObserver(
      (entrees) =>
        entrees.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("actif");
            obs.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -35% 0px", threshold: 1 },
    );
    mots.forEach((m) => obs.observe(m));
    return () => obs.disconnect();
  }, []);
  return (
    <section aria-label="Notre promesse" className="px-4 py-24 sm:py-32">
      <p ref={ref} className="mx-auto max-w-[680px] text-4xl font-semibold sm:text-5xl lg:text-6xl" style={{ ...titre, textWrap: "balance" }}>
        {lignes.map((l, i) => (
          <span key={i} className="block">
            {l.map((m, j) => (
              <span key={j} className={`mot ${i === 2 ? "corail" : ""}`}>{m} </span>
            ))}
          </span>
        ))}
      </p>
    </section>
  );
}

const ESPACES = [
  { icone: Smartphone, nom: "Espace élève", texte: "Menus du jour et à venir filtrés selon les allergies, plat personnalisé, portion au tiers près, ticket QR.", grand: true },
  { icone: Monitor, nom: "Borne de commande", texte: "Pour les élèves sans téléphone : matricule, code PIN, commande, déconnexion automatique." },
  { icone: ChefHat, nom: "Espace cuisine", texte: "Plats, composition, suppléments, prix des portions, stocks, vagues de service et retours d'assiettes." },
  { icone: BarChart3, nom: "Administration", texte: "Créneaux, plan de salle, élèves, chefs de cuisine, statistiques du jour et du mois." },
  { icone: Users, nom: "Espace parent", texte: "Recharge Mobile Money, allergies, menu de la semaine et notification à chaque repas." },
];

const PARCOURS = [
  { n: "01", titre: "Découvrir le menu", texte: "Les plats publiés par la cuisine, avec leurs ingrédients. Ceux qui contiennent un allergène déclaré n'apparaissent pas." },
  { n: "02", titre: "Personnaliser son plat", texte: "Attiéké et poisson inclus, piment au choix, alloco en supplément. Le prix se met à jour à chaque choix." },
  { n: "03", titre: "Réserver sa portion", texte: "Un tiers, deux tiers ou l'assiette complète. Le montant est débité du crédit de l'élève." },
  { n: "04", titre: "Retrouver sa place", texte: "Vague, table et chaise choisies sur le plan de salle. Le QR code et un code à 6 caractères suffisent au comptoir." },
];

const AVANTAGES = [
  { icone: Leaf, titre: "Moins de gaspillage", texte: "Les cuisiniers préparent les quantités réellement commandées, en tiers de portion, avec une marge de 5 %." },
  { icone: ShieldCheck, titre: "Allergies verrouillées", texte: "La vérification porte sur la composition finale du plat, côté serveur, et se répète au comptoir." },
  { icone: Clock3, titre: "Service fluide", texte: "Les élèves arrivent par vagues, à une place déjà attribuée. L'agent valide un repas en un scan." },
  { icone: Wallet, titre: "Paiement sans espèces", texte: "Crédit rechargé par les parents, montants entiers en FCFA, remboursement automatique en cas d'annulation." },
];

const FAQ = [
  ["Et si un élève n'a pas de téléphone ?", "Oui. La borne de l'école permet de commander avec le matricule et le code PIN, puis ferme la session automatiquement."],
  ["Et si le QR code ne s'affiche pas ?", "Chaque réservation reçoit aussi un code de 6 caractères. L'agent le saisit au comptoir et retrouve la commande."],
  ["Qui fixe les prix des portions ?", "Les chefs de cuisine. Un changement de prix ne modifie jamais une réservation déjà confirmée."],
  ["Comment sont gérées les allergies ?", "Les parents les déclarent. Les plats incompatibles sont masqués et un accompagnement incompatible ne peut pas être ajouté."],
  ["Quelle installation prévoir ?", "Non. Cantine Vatel fonctionne dans le navigateur et peut être ajoutée à l'écran d'accueil comme une application."],
  ["Plusieurs chefs dans une même cuisine ?", "Oui. L'administration crée les comptes et peut affecter plusieurs chefs aux mêmes niveaux."],
];

const ACCES = [
  { to: "/login", icone: Smartphone, titre: "Je suis élève", texte: "Matricule et code PIN" },
  { to: "/borne", icone: Monitor, titre: "Borne de l'école", texte: "Commander sans téléphone" },
  { to: "/pro", icone: KeyRound, titre: "Personnel ou parent", texte: "Cuisine, agent, administration, parents" },
];

export default function Landing() {
  useRevele();
  useEffect(() => {
    const avant = document.title;
    document.title = "Cantine Vatel · La cantine scolaire, pensée autrement";
    return () => { document.title = avant; };
  }, []);

  return (
    <div id="haut" className="min-h-dvh overflow-x-clip bg-white text-[#222222]">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[#222222] focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <Navigation />

      <main id="contenu">
        {/* Hero */}
        <section className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-32 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-40">
          <div className="revele visible">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">Restauration scolaire</p>
            <h1 className="mt-4 max-w-[680px] text-5xl font-semibold sm:text-6xl lg:text-7xl" style={{ ...titre, textWrap: "balance" }}>
              La cantine scolaire,
              <br />
              pensée autrement.
            </h1>
            <p className="mt-6 max-w-[680px] text-lg text-[#717171]" style={{ textWrap: "pretty" }}>
              Menus, réservations, commandes et suivi des repas réunis dans une seule plateforme,
              pour les élèves, les cuisiniers, les agents, l'administration et les parents.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#essayer"
                className={`group inline-flex min-h-12 items-center gap-2 rounded-full bg-[#222222] py-2 pl-6 pr-2 text-base font-semibold text-white transition duration-300 ${COURBE} hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A5F]`}>
                Essayer Cantine Vatel
                <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5A5F] transition-transform duration-500 ${COURBE} group-hover:translate-x-1`}>
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </a>
              <BoutonInstaller />
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-[#717171]">
              <Check size={16} className="text-[#FF5A5F]" aria-hidden="true" />
              Cinq espaces connectés, utilisables depuis un téléphone, une borne ou un ordinateur.
            </p>
          </div>
          <VisuelHero />
        </section>

        {/* Présentation */}
        <section id="presentation" className="scroll-mt-24 bg-[#F7F7F7] px-4 py-24 sm:px-8">
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div className="revele">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">Présentation</p>
              <h2 className="mt-4 text-4xl font-semibold sm:text-5xl" style={{ ...titre, textWrap: "balance" }}>
                Chaque repas prévu, préparé et servi au bon élève.
              </h2>
            </div>
            <div className="revele grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Avant", "Des files au comptoir, des quantités estimées, des listes d'allergies sur papier, de l'argent liquide à gérer."],
                ["Avec Cantine Vatel", "Des commandes connues à l'avance, des portions au tiers près, des contrôles automatiques et un crédit rechargé en ligne."],
              ].map(([t, x], i) => (
                <article key={t} className={`rounded-[22px] p-6 ${i ? "bg-[#222222] text-white" : "bg-white"}`}>
                  <p className={`text-sm font-semibold ${i ? "text-[#FF5A5F]" : "text-[#717171]"}`}>{t}</p>
                  <p className={`mt-3 text-lg ${i ? "text-white" : "text-[#222222]"}`} style={{ textWrap: "pretty" }}>{x}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Tagline />

        {/* Fonctionnalités */}
        <section id="fonctionnalites" className="scroll-mt-24 px-4 pb-24 sm:px-8">
          <div className="mx-auto max-w-[1120px]">
            <div className="revele max-w-[680px]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">Fonctionnalités</p>
              <h2 className="mt-4 text-4xl font-semibold sm:text-5xl" style={{ ...titre, textWrap: "balance" }}>
                Un espace pour chaque personne qui fait vivre la cantine.
              </h2>
            </div>
            <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              {ESPACES.map(({ icone: Icone, nom, texte, grand }, i) => (
                <li key={nom} style={{ transitionDelay: `${(i % 3) * 80}ms` }}
                  className={`revele group rounded-[22px] border border-[#EBEBEB] p-6 transition-colors duration-300 hover:border-[#222222] ${grand ? "md:col-span-2 md:row-span-2 md:p-8" : ""}`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0ED] text-[#FF5A5F]">
                    <Icone size={22} aria-hidden="true" />
                  </span>
                  <h3 className={`mt-6 font-semibold ${grand ? "text-3xl" : "text-xl"}`} style={titre}>{nom}</h3>
                  <p className="mt-2 text-base text-[#717171]" style={{ textWrap: "pretty" }}>{texte}</p>
                  {grand && (
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <img src={PHOTO_RIZ} alt="Riz sauce arachide" loading="lazy" className="aspect-[4/3] w-full rounded-[22px] object-cover" />
                      <div className="rounded-[22px] bg-[#F7F7F7] p-4">
                        <p className="text-sm font-semibold">Personnalise ton plat</p>
                        {[["Piment", true, "Sans supplément"], ["Alloco", true, "+250 F"], ["Oignons frits", false, "+100 F"]].map(([n, on, s]) => (
                          <div key={n} className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-3 py-2">
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{n}</span>
                              <span className="block text-xs text-[#717171]">{s}</span>
                            </span>
                            <span className={`relative h-6 w-10 rounded-full ${on ? "bg-[#FF5A5F]" : "bg-[#EBEBEB]"}`} aria-hidden="true">
                              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white ${on ? "right-1" : "left-1"}`} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Expérience élève */}
        <section aria-labelledby="titre-experience" className="bg-[#222222] px-4 py-24 text-white sm:px-8">
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div className="revele lg:sticky lg:top-32 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">L'expérience élève</p>
              <h2 id="titre-experience" className="mt-4 text-4xl font-semibold sm:text-5xl" style={{ ...titre, textWrap: "balance" }}>
                Du menu à la chaise, en quatre gestes.
              </h2>
              <p className="mt-6 max-w-[480px] text-lg text-white/70" style={{ textWrap: "pretty" }}>
                Le même parcours sur téléphone et sur la borne, avec les mêmes règles et le même ticket.
              </p>
            </div>
            <ol className="grid grid-cols-1 gap-4">
              {PARCOURS.map((p) => (
                <li key={p.n} className="revele rounded-[22px] bg-white/5 p-6 sm:p-8">
                  <p className="text-sm font-semibold text-[#FF5A5F]">{p.n}</p>
                  <h3 className="mt-2 text-2xl font-semibold" style={titre}>{p.titre}</h3>
                  <p className="mt-2 text-base text-white/70" style={{ textWrap: "pretty" }}>{p.texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pour les écoles */}
        <section id="ecoles" className="scroll-mt-24 px-4 py-24 sm:px-8">
          <div className="mx-auto max-w-[1120px]">
            <div className="revele flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[680px]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5A5F]">Pour les écoles</p>
                <h2 className="mt-4 text-4xl font-semibold sm:text-5xl" style={{ ...titre, textWrap: "balance" }}>
                  Une cantine mieux tenue, sans charge en plus pour les équipes.
                </h2>
              </div>
            </div>
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AVANTAGES.map(({ icone: Icone, titre: t, texte }, i) => (
                <li key={t} className={`revele rounded-[22px] p-6 ${i === 1 ? "bg-[#FFF0ED]" : "bg-[#F7F7F7]"}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <Icone size={22} className="text-[#FF5A5F]" aria-hidden="true" />
                  <h3 className="mt-6 text-xl font-semibold" style={titre}>{t}</h3>
                  <p className="mt-2 text-sm text-[#717171]" style={{ textWrap: "pretty" }}>{texte}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="titre-faq" className="px-4 pb-24 sm:px-8">
          <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
            <h2 id="titre-faq" className="revele text-4xl font-semibold" style={{ ...titre, textWrap: "balance" }}>Questions fréquentes</h2>
            <div className="revele divide-y divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB]">
              {FAQ.map(([q, r]) => (
                <details key={q} className="group px-6 py-2">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">{q}</span>
                    <Plus size={18} aria-hidden="true" className={`shrink-0 transition-transform duration-500 ${COURBE} group-open:rotate-45`} />
                  </summary>
                  <p className="pb-4 text-base text-[#717171]" style={{ textWrap: "pretty" }}>{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Appel final */}
        <section id="essayer" className="scroll-mt-24 px-4 pb-24 sm:px-8">
          <div className="revele mx-auto max-w-[1120px] rounded-[32px] bg-[#FFF0ED] px-6 py-16 sm:px-12">
            <h2 className="max-w-[680px] text-4xl font-semibold sm:text-6xl" style={{ ...titre, textWrap: "balance" }}>
              Essayez Cantine Vatel
              <span className="text-[#FF5A5F]"> dès aujourd'hui.</span>
            </h2>
            <p className="mt-4 max-w-[680px] text-lg text-[#717171]">Choisissez votre accès. Aucune installation, aucun matériel spécifique.</p>
            <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {ACCES.map(({ to, icone: Icone, titre: t, texte }) => (
                <li key={to}>
                  <Link to={to}
                    className={`group flex min-h-24 items-center gap-4 rounded-[22px] bg-white p-6 transition duration-500 ${COURBE} hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(34,34,34,0.1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#FF5A5F]`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#222222] text-white">
                      <Icone size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold">{t}</span>
                      <span className="block text-sm text-[#717171]">{texte}</span>
                    </span>
                    <ArrowRight size={18} aria-hidden="true" className={`shrink-0 transition-transform duration-500 ${COURBE} group-hover:translate-x-1`} />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6"><BoutonInstaller /></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#EBEBEB] px-4 py-12 sm:px-8">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[320px]">
            <div className="flex items-center gap-2">
              <img src={APP_LOGO} alt="" className="h-8 w-8" />
              <span className="text-base font-semibold">{APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-[#717171]">La plateforme de gestion de la restauration scolaire.</p>
          </div>
          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {LIENS.map((l) => <a key={l.href} href={l.href} className="flex min-h-10 items-center text-[#717171] hover:text-[#222222]">{l.label}</a>)}
            {ACCES.map((a) => <Link key={a.to} to={a.to} className="flex min-h-10 items-center text-[#717171] hover:text-[#222222]">{a.titre}</Link>)}
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-[1120px] text-xs text-[#B0B0B0]">© 2026 {APP_NAME}. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
