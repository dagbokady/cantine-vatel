import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Plus } from "lucide-react";
import { getEnfants, getRecharges } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { BoutonAction } from "../../components/Panneau";
import OperateurLogo from "../../components/parent/OperateurLogo";
import Recharge from "../../components/parent/Recharge";
import { fcfa } from "../../utils/format";
import { operateur } from "../../utils/operateurs";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_PARENT } from "./onglets";

const STATUTS = {
  validee: { label: "Réussi", cls: "bg-[#FFF0ED] text-[#222222]" },
  echouee: { label: "Échoué", cls: "bg-white border border-[#B30000] text-[#B30000]" },
  en_attente: { label: "En attente", cls: "bg-[#F7F7F7] text-[#717171]" },
};
const jour = (iso) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const heure = (iso) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function Paiements() {
  const [liste, setListe] = useState(null);
  const [enfants, setEnfants] = useState([]);
  const [ouvert, setOuvert] = useState(false);
  const charger = useCallback(() => getRecharges().then(setListe).catch(() => setListe([])), []);
  useEffect(() => { charger(); getEnfants().then(setEnfants).catch(() => {}); }, [charger]);

  const total = liste?.filter((t) => t.statut === "validee").reduce((s, t) => s + t.montant, 0) ?? 0;
  const groupes = (liste ?? []).reduce((acc, t) => {
    const k = jour(t.created_at);
    (acc[k] ||= []).push(t);
    return acc;
  }, {});

  return (
    <EspaceLayout titre="Rechargements" onglets={ONGLETS_PARENT}
      action={enfants.length > 0 && <BoutonAction icone={Plus} onClick={() => setOuvert(true)}>Recharger</BoutonAction>}>
      <p className="flex items-center gap-2 text-[13px] text-[#717171]">
        <FlaskConical size={15} className="text-[#FF5A5F]" aria-hidden="true" /> Paiements simulés : aucun débit réel.
      </p>
      {liste?.length > 0 && (
        <p className="mt-4 text-[15px] text-[#717171]">
          <span className="text-[28px] font-semibold text-[#222222]" style={titreStyle}>{fcfa(total)}</span> rechargés avec succès
        </p>
      )}
      {liste?.length === 0 && (
        <div className="mt-6 rounded-[22px] bg-[#F7F7F7] px-6 py-12 text-center">
          <p className="text-[20px] font-semibold" style={titreStyle}>Aucun rechargement</p>
          <p className="mt-2 text-[15px] text-[#717171]">Vos paiements Mobile Money apparaîtront ici.</p>
        </div>
      )}
      {Object.entries(groupes).map(([j, txs]) => (
        <section key={j} className="mt-8">
          <h2 className="text-[13px] font-medium text-[#717171] first-letter:uppercase">{j}</h2>
          <ul className="mt-2 divide-y divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB]">
            {txs.map((t) => {
              const s = STATUTS[t.statut] ?? STATUTS.en_attente;
              return (
                <li key={t.reference} className="flex items-start gap-3 p-4">
                  <OperateurLogo id={t.operateur} taille={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[15px] font-medium text-[#222222]">{t.eleve_nom}</p>
                      <p className={`shrink-0 text-[16px] font-semibold ${t.statut === "validee" ? "text-[#222222]" : "text-[#B0B0B0] line-through"}`}>
                        {fcfa(t.montant)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#717171]">{heure(t.created_at)} · {operateur(t.operateur).nom} · {t.telephone_masque}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[12px] text-[#B0B0B0]">{t.reference}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {ouvert && (
        <Recharge ouvert enfants={enfants} onClose={() => setOuvert(false)}
          onTermine={() => { charger(); getEnfants().then(setEnfants).catch(() => {}); }} />
      )}
    </EspaceLayout>
  );
}
