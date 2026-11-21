import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { activerAcces, getAllergenes, getEnfants, getHistoriqueEnfant, majAllergies } from "../../api/pro";
import { Pencil, Search, Wallet, X } from "lucide-react";
import Recharge from "../../components/parent/Recharge";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { Avatar } from "../../components/ui";
import { fcfa, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_PARENT } from "./onglets";

const STATUT = { commandee: "Commandé", servie: "Servi", annulee: "Annulé" };
const dateFr = (iso) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

function Section({ titre, children, className = "" }) {
  return (
    <section className={`border-t border-[#EBEBEB] py-8 ${className}`}>
      <h2 className="mb-4 text-[20px] font-semibold" style={titreStyle}>{titre}</h2>
      {children}
    </section>
  );
}

const sansAccent = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const maj = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function Puce({ nom, actif, detail, onClick }) {
  return (
    <button type="button" aria-pressed={actif} onClick={onClick}
      className={`min-h-10 rounded-full border px-4 py-2 text-left text-[14px] leading-5 transition-colors ${actif ? "border-[#FF5A5F] bg-[#FFF0ED] font-medium text-[#222222]" : "border-[#EBEBEB] bg-white text-[#717171] hover:border-[#222222]"}`}>
      {maj(nom)}
      {detail && <span className="block text-[12px] font-normal text-[#B0B0B0]">{detail}</span>}
    </button>
  );
}

// Grande base : recherche par allergène ou par aliment (« crevette » trouve « crustacés »).
function ChoixAllergies({ tous, choix, onChange }) {
  const [q, setQ] = useState("");
  const basculer = (a) => onChange(choix.includes(a) ? choix.filter((x) => x !== a) : [...choix, a].sort());
  const r = sansAccent(q.trim());
  const trouves = r ? tous.filter((a) => sansAccent(a.nom).includes(r) || a.ingredients.some((i) => sansAccent(i).includes(r))) : [];
  const categories = [...new Set(tous.map((a) => a.categorie))];

  return (
    <div className="mt-4">
      <label className="relative block">
        <span className="sr-only">Rechercher un allergène ou un aliment</span>
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#B0B0B0]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Crevette, tomate, lait…"
          className="h-12 w-full rounded-full border border-[#EBEBEB] bg-[#F7F7F7] pl-11 pr-11 text-[16px] outline-none placeholder:text-[#B0B0B0] focus:border-[#222222] focus:bg-white" />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#717171] hover:bg-[#EBEBEB]">
            <X size={16} />
          </button>
        )}
      </label>

      {choix.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {choix.map((a) => (
            <button key={a} type="button" onClick={() => basculer(a)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#222222] pl-4 pr-3 text-[13px] font-medium text-white">
              {maj(a)} <X size={14} />
            </button>
          ))}
        </div>
      )}

      {r ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {trouves.length ? trouves.map((a) => {
            const viaIngr = !sansAccent(a.nom).includes(r) && a.ingredients.filter((i) => sansAccent(i).includes(r));
            return <Puce key={a.nom} nom={a.nom} actif={choix.includes(a.nom)} onClick={() => basculer(a.nom)}
              detail={viaIngr ? `présent dans : ${viaIngr.slice(0, 3).join(", ")}` : null} />;
          }) : <p className="text-[14px] text-[#717171]">Aucun résultat. Précise-le dans le régime ci-dessous.</p>}
        </div>
      ) : categories.map((c) => (
        <div key={c} className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#717171]">{c}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tous.filter((a) => a.categorie === c).map((a) => (
              <Puce key={a.nom} nom={a.nom} actif={choix.includes(a.nom)} onClick={() => basculer(a.nom)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Enfant() {
  const { id } = useParams();
  const [enfant, setEnfant] = useState(null);
  const [hist, setHist] = useState(null);
  const [tous, setTous] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [regime, setRegime] = useState("");
  const [recharge, setRecharge] = useState(false);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const [envoi, setEnvoi] = useState(false);
  const [edition, setEdition] = useState(false);

  const charger = useCallback(async () => {
    const [liste, h] = await Promise.all([getEnfants(), getHistoriqueEnfant(id)]);
    const e = liste.find((x) => String(x.id) === id);
    setEnfant(e);
    setAllergies(e?.allergies || []);
    setRegime(e?.regime || "");
    setHist(h);
  }, [id]);

  useEffect(() => {
    charger().catch(() => setMsg({ texte: "Enfant introuvable.", ok: false }));
    getAllergenes().then(setTous).catch(() => {});
  }, [charger]);

  const action = async (fn, succes) => {
    setEnvoi(true);
    setMsg({ texte: "", ok: true });
    try {
      await fn();
      await charger();
      setMsg({ texte: succes, ok: true });
      setEdition(false);
    } catch (e) {
      setMsg({ texte: e.response?.data?.detail || "Action impossible.", ok: false });
    } finally {
      setEnvoi(false);
    }
  };

  if (!enfant) return <EspaceLayout titre="Enfant" onglets={ONGLETS_PARENT}><Alerte ok={msg.ok}>{msg.texte || "Chargement…"}</Alerte></EspaceLayout>;

  const modifie = allergies.join() !== enfant.allergies.join() || regime !== (enfant.regime || "");

  return (
    <EspaceLayout titre={enfant.nom} surTitre={`${enfant.classe} · ${enfant.matricule}`} onglets={ONGLETS_PARENT}>
      <div className="overflow-hidden rounded-[22px] bg-[#222222] text-white">
        <div className="flex items-center gap-4 p-5">
          <Avatar nom={enfant.nom} photo={enfant.photo} taille={56} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-white/60">Solde disponible</p>
            <p className={`text-[36px] font-semibold leading-none ${enfant.solde < 0 ? "text-[#FF5A5F]" : "text-white"}`} style={titreStyle}>{fcfa(enfant.solde)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 bg-white/[0.06] px-5 py-4">
          <p className="text-[13px] text-white/60">Wave, MTN, Orange, Moov</p>
          <button type="button" onClick={() => setRecharge(true)}
            className="flex h-11 items-center gap-2 rounded-full bg-[#FF5A5F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#E94E53]">
            <Wallet size={16} /> Recharger
          </button>
        </div>
      </div>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>

      <Section titre="Allergies et régime" className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              {enfant.allergies.length ? enfant.allergies.map((a) => (
                <span key={a} className="rounded-full border border-[#FF5A5F] bg-[#FFF0ED] px-4 py-2 text-[14px] font-medium text-[#222222]">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
              )) : <span className="text-[14px] text-[#717171]">Aucune allergie déclarée</span>}
            </div>
            <p className="mt-3 text-[14px] text-[#717171]">Régime : <span className="text-[#222222]">{enfant.regime || "aucun"}</span></p>
          </div>
          <BoutonAction variante="doux" icone={Pencil} onClick={() => { setAllergies(enfant.allergies); setRegime(enfant.regime || ""); setEdition(true); }}>Modifier</BoutonAction>
        </div>
      </Section>

      <Section titre="Repas">
        {hist?.repas.length === 0 && <p className="text-[14px] text-[#717171]">Aucun repas pour le moment.</p>}
        <ul className="space-y-3">
          {hist?.repas.map((r) => (
            <li key={r.id} className="rounded-[22px] border border-[#EBEBEB] p-4">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="capitalize text-[#717171]">{dateFr(r.date)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${r.statut === "servie" ? "bg-[#FFF0ED] text-[#222222]" : r.statut === "annulee" ? "bg-[#F7F7F7] text-[#B0B0B0]" : "bg-[#F7F7F7] text-[#717171]"}`}>
                  {STATUT[r.statut]}{r.servie_a && ` · ${new Date(r.servie_a).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
              <p className="mt-2 text-[16px] font-semibold text-[#222222]">{r.plat_nom}</p>
              <p className="text-[14px] text-[#717171]">{tiersEnFraction(r.tiers)} · {fcfa(r.prix)}</p>
              <p className="mt-1.5 text-[13px] text-[#717171]">{r.ingredients.join(", ")}</p>
              {r.allergenes.length > 0 && <p className="text-[12px] text-[#B0B0B0]">Allergènes : {r.allergenes.join(", ")}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section titre="Mouvements">
        {hist?.transactions.length === 0 && <p className="text-[14px] text-[#717171]">Aucun mouvement.</p>}
        <ul className="divide-y divide-[#EBEBEB]">
          {hist?.transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] text-[#222222]">{t.libelle}</p>
                <p className="text-[12px] text-[#B0B0B0]">{new Date(t.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}{t.statut !== "validee" && ` · ${t.statut === "echouee" ? "échoué, non crédité" : "en attente"}`}</p>
              </div>
              <span className={`shrink-0 text-[15px] font-semibold ${t.statut !== "validee" ? "text-[#B0B0B0] line-through" : t.montant >= 0 ? "text-[#FF5A5F]" : "text-[#222222]"}`}>
                {t.montant >= 0 ? "+" : ""}{fcfa(t.montant)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section titre="Accès élève">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#F7F7F7] p-5">
          <p className="min-w-[200px] flex-1 text-[14px] text-[#717171]">
            {enfant.acces_actif ? "Ton enfant a choisi son PIN." : "Accès activé : ton enfant choisira son PIN à sa prochaine connexion."}
          </p>
          <Bouton variante="contour" disabled={envoi || !enfant.acces_actif}
            onClick={() => action(() => activerAcces(enfant.id), "Accès réinitialisé : nouveau PIN à la prochaine connexion.")}>
            Réinitialiser le PIN
          </Bouton>
        </div>
      </Section>
      {recharge && (
        <Recharge ouvert enfants={[enfant]} enfantId={enfant.id} onClose={() => setRecharge(false)} onTermine={() => charger()} />
      )}
      <Panneau ouvert={edition} onClose={() => setEdition(false)} titre="Allergies et régime" surTitre={enfant.nom}
        pied={
          <Bouton className="w-full" disabled={!modifie || envoi}
            onClick={() => action(() => majAllergies(enfant.id, allergies, regime), "Allergies enregistrées.")}>
            Enregistrer
          </Bouton>
        }>
        <p className="text-[14px] text-[#717171]">Toi seul peux les modifier. Les plats concernés ne seront ni proposés ni servis.</p>
        <ChoixAllergies tous={tous} choix={allergies} onChange={setAllergies} />
        <label className="mt-5 block text-[13px] font-medium">Régime
          <input value={regime} onChange={(e) => setRegime(e.target.value)} placeholder="ex. sans porc, végétarien"
            className="mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] px-4 text-[16px] outline-none placeholder:text-[#B0B0B0] focus:border-[#222222]" />
        </label>
      </Panneau>
    </EspaceLayout>
  );
}
