import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { activerAcces, getAllergenes, getEnfants, getHistoriqueEnfant, majAllergies, recharger } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { Avatar, Libelle } from "../../components/ui";
import { fcfa, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_PARENT } from "./onglets";

const MONTANTS = [1000, 2000, 5000, 10000];
const STATUT = { commandee: "Commandé", servie: "Servi", annulee: "Annulé" };
const dateFr = (iso) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

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
    <EspaceLayout titre={enfant.nom} onglets={ONGLETS_PARENT}>
      <div className="flex items-center gap-4">
        <Avatar nom={enfant.nom} photo={enfant.photo} taille={64} />
        <div>
          <p className="text-[15px] text-[#616161]">{enfant.classe} · {enfant.matricule}</p>
          <p className={`text-[28px] font-medium ${enfant.solde < 0 ? "text-[#b30000]" : "text-[#212121]"}`} style={titreStyle}>{fcfa(enfant.solde)}</p>
        </div>
      </div>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>

      <section className="mt-6">
        <Libelle>Recharger le crédit</Libelle>
        <div className="mt-2 flex flex-wrap gap-2">
          {MONTANTS.map((m) => (
            <button key={m} type="button" onClick={() => setMontant(m)}
              className={`h-10 rounded-full px-4 text-[14px] ${montant === m ? "bg-[#17171c] font-medium text-white" : "bg-[#eeece7] text-[#212121]"}`}>
              {fcfa(m)}
            </button>
          ))}
        </div>
        <Bouton variante="vert" className="mt-3 w-full" disabled={envoi}
          onClick={() => action(() => recharger(enfant.id, montant), `Recharge de ${fcfa(montant)} validée.`)}>
          Payer {fcfa(montant)} (paiement simulé)
        </Bouton>
      </section>

      <section className="mt-8">
        <Libelle>Allergies et régime</Libelle>
        <p className="mt-1 text-[13px] text-[#93939f]">Toi seul peux les modifier. Les plats concernés ne seront ni proposés ni servis.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tous.map((a) => {
            const actif = allergies.includes(a);
            return (
              <button key={a} type="button" aria-pressed={actif}
                onClick={() => setAllergies(actif ? allergies.filter((x) => x !== a) : [...allergies, a].sort())}
                className={`h-10 rounded-full border px-4 text-[14px] ${actif ? "border-[#ff7759] bg-[#eeece7] font-medium text-[#212121]" : "border-[#d9d9dd] bg-white text-[#616161]"}`}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            );
          })}
        </div>
        <input value={regime} onChange={(e) => setRegime(e.target.value)} placeholder="Régime (ex. sans porc, végétarien)"
          className="mt-3 h-12 w-full rounded-[12px] border border-[#d9d9dd] px-4 text-[15px] outline-none focus:border-[#003c33]" />
        <Bouton className="mt-3 w-full" disabled={!modifie || envoi}
          onClick={() => action(() => majAllergies(enfant.id, allergies, regime), "Allergies enregistrées.")}>
          Enregistrer
        </Bouton>
      </section>

      <section className="mt-8">
        <Libelle>Accès élève</Libelle>
        <p className="mt-1 text-[14px] text-[#616161]">
          {enfant.acces_actif ? "Ton enfant a choisi son PIN." : "Accès activé : ton enfant choisira son PIN à sa prochaine connexion."}
        </p>
        <Bouton variante="doux" className="mt-2 w-full" disabled={envoi || !enfant.acces_actif}
          onClick={() => action(() => activerAcces(enfant.id), "Accès réinitialisé : nouveau PIN à la prochaine connexion.")}>
          Réinitialiser le PIN
        </Bouton>
      </section>

      <section className="mt-8">
        <Libelle>Repas</Libelle>
        {hist?.repas.length === 0 && <p className="mt-2 text-[14px] text-[#616161]">Aucun repas pour le moment.</p>}
        <ul className="mt-2 space-y-2">
          {hist?.repas.map((r) => (
            <li key={r.id}>
              <Carte className="border-[#f2f2f2] p-3">
                <div className="flex justify-between text-[13px] text-[#93939f]">
                  <span>{dateFr(r.date)}</span>
                  <span>{STATUT[r.statut]}{r.servie_a && ` à ${new Date(r.servie_a).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}</span>
                </div>
                <p className="mt-0.5 text-[15px] font-medium text-[#212121]">{r.plat_nom}</p>
                <p className="text-[14px] text-[#616161]">{tiersEnFraction(r.tiers)} · {fcfa(r.prix)}</p>
                <p className="mt-1 text-[13px] text-[#616161]">{r.ingredients.join(", ")}</p>
                {r.allergenes.length > 0 && <p className="text-[13px] text-[#93939f]">Allergènes : {r.allergenes.join(", ")}</p>}
              </Carte>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <Libelle>Mouvements</Libelle>
        <ul className="mt-2 divide-y divide-[#f2f2f2]">
          {hist?.transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] text-[#212121]">{t.libelle}</p>
                <p className="text-[12px] text-[#93939f]">{new Date(t.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}{t.statut !== "validee" && ` · ${t.statut}`}</p>
              </div>
              <span className={`shrink-0 text-[14px] font-medium ${t.montant >= 0 ? "text-[#003c33]" : "text-[#212121]"}`}>
                {t.montant >= 0 ? "+" : ""}{fcfa(t.montant)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </EspaceLayout>
  );
}
