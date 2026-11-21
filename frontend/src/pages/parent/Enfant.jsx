import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { activerAcces, getAllergenes, getEnfants, getHistoriqueEnfant, majAllergies, recharger } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { fcfa, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_PARENT } from "./onglets";

const MONTANTS = [1000, 2000, 5000, 10000];
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

export default function Enfant() {
  const { id } = useParams();
  const [enfant, setEnfant] = useState(null);
  const [hist, setHist] = useState(null);
  const [tous, setTous] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [regime, setRegime] = useState("");
  const [montant, setMontant] = useState(2000);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const [envoi, setEnvoi] = useState(false);

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
        <div className="bg-white/[0.06] p-5">
          <p className="text-[13px] text-white/60">Recharger le crédit</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {MONTANTS.map((m) => (
              <button key={m} type="button" onClick={() => setMontant(m)} aria-pressed={montant === m}
                className={`h-11 rounded-full text-[13px] font-medium transition-colors ${montant === m ? "bg-white text-[#222222]" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {fcfa(m).replace(/\s?F$/, "")}
              </button>
            ))}
          </div>
          <Bouton variante="corail" className="mt-4 h-[52px] w-full" disabled={envoi}
            onClick={() => action(() => recharger(enfant.id, montant), `Recharge de ${fcfa(montant)} validée.`)}>
            Payer {fcfa(montant)}
          </Bouton>
          <p className="mt-2 text-center text-[12px] text-white/40">Paiement simulé</p>
        </div>
      </div>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>

      <Section titre="Allergies et régime" className="mt-4">
        <p className="-mt-2 mb-4 text-[14px] text-[#717171]">Toi seul peux les modifier. Les plats concernés ne seront ni proposés ni servis.</p>
        <div className="flex flex-wrap gap-2">
          {tous.map((a) => {
            const actif = allergies.includes(a);
            return (
              <button key={a} type="button" aria-pressed={actif}
                onClick={() => setAllergies(actif ? allergies.filter((x) => x !== a) : [...allergies, a].sort())}
                className={`h-10 rounded-full border px-4 text-[14px] transition-colors ${actif ? "border-[#FF5A5F] bg-[#FFF0ED] font-medium text-[#222222]" : "border-[#EBEBEB] bg-white text-[#717171] hover:border-[#222222]"}`}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            );
          })}
        </div>
        <input value={regime} onChange={(e) => setRegime(e.target.value)} placeholder="Régime (ex. sans porc, végétarien)"
          className="mt-4 h-12 w-full rounded-[12px] border border-[#EBEBEB] px-4 text-[15px] outline-none placeholder:text-[#B0B0B0] focus:border-[#222222]" />
        <Bouton className="mt-3 w-full" disabled={!modifie || envoi}
          onClick={() => action(() => majAllergies(enfant.id, allergies, regime), "Allergies enregistrées.")}>
          Enregistrer
        </Bouton>
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
                <p className="text-[12px] text-[#B0B0B0]">{new Date(t.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}{t.statut !== "validee" && ` · ${t.statut}`}</p>
              </div>
              <span className={`shrink-0 text-[15px] font-semibold ${t.montant >= 0 ? "text-[#FF5A5F]" : "text-[#222222]"}`}>
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
    </EspaceLayout>
  );
}
