import { useEffect, useState } from "react";
import { getDashboard } from "../../api/pro";
import EspaceLayout, { Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { fcfa, formatHeure } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";

const n = (x) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

function Tuile({ label, valeur, accent }) {
  return (
    <Carte className="border-[#f2f2f2]">
      <p className="text-[13px] text-[#93939f]">{label}</p>
      <p className={`mt-1 text-[32px] font-medium ${accent || "text-[#212121]"}`} style={titreStyle}>{valeur}</p>
    </Carte>
  );
}

function Barre({ label, valeur, max, detail }) {
  const pct = max ? Math.min(100, (100 * valeur) / max) : 0;
  return (
    <div className="py-2">
      <div className="flex justify-between text-[14px]">
        <span className="text-[#212121]">{label}</span>
        <span className="text-[#616161]">{detail}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eeece7]">
        <div className="h-full rounded-full bg-[#003c33]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TableauDeBord() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [d, setD] = useState(null);
  useEffect(() => { getDashboard(date).then(setD).catch(() => setD(null)); }, [date]);

  return (
    <EspaceLayout titre="Tableau de bord" onglets={ONGLETS_ADMIN} large>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date"
        className="h-12 rounded-[12px] border border-[#d9d9dd] px-4 text-[15px]" />
      {d && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Tuile label="Portions préparées" valeur={n(d.portions.preparees)} />
            <Tuile label="Commandées" valeur={n(d.portions.commandees)} />
            <Tuile label="Servies" valeur={n(d.portions.servies)} accent="text-[#003c33]" />
            <Tuile label="Restantes" valeur={n(d.portions.restantes)} />
            <Tuile label="Sauvées (anti-gaspi)" valeur={n(d.portions.sauvees)} />
            <Tuile label="Taux de gaspillage" valeur={`${n(d.portions.taux_gaspillage)} %`} accent={d.portions.taux_gaspillage > 20 ? "text-[#b30000]" : "text-[#003c33]"} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Carte>
              <Libelle>Affluence par créneau</Libelle>
              {d.creneaux.length === 0 && <p className="mt-2 text-[14px] text-[#616161]">Aucun créneau.</p>}
              {d.creneaux.map((c) => (
                <Barre key={c.heure_debut} label={`${formatHeure(c.heure_debut)} – ${formatHeure(c.heure_fin)}`}
                  valeur={c.commandes} max={c.capacite} detail={`${c.commandes} / ${c.capacite} · ${c.servies} servis`} />
              ))}
              <p className="mt-3 text-[14px] text-[#616161]">Occupation de la salle : <span className="font-medium text-[#212121]">{n(d.occupation_salle)} %</span></p>
            </Carte>
            <Carte>
              <Libelle>Présence par classe</Libelle>
              {d.presence_par_classe.map((c) => (
                <Barre key={c.classe} label={c.classe} valeur={c.presents} max={c.attendus} detail={`${c.presents} / ${c.attendus}`} />
              ))}
            </Carte>
            <Carte>
              <Libelle>Recettes du jour</Libelle>
              <p className="mt-2 text-[28px] font-medium" style={titreStyle}>{fcfa(d.recettes.ventes)}</p>
              <p className="text-[14px] text-[#616161]">de repas commandés</p>
              <p className="mt-2 text-[16px] font-medium">{fcfa(d.recettes.recharges)}</p>
              <p className="text-[14px] text-[#616161]">de recharges validées</p>
              <div className="mt-4"><Libelle>Allergies déclarées</Libelle></div>
              {d.allergies.map((a) => (
                <p key={a.allergene} className="flex justify-between py-1 text-[14px]"><span>{a.allergene}</span><span className="text-[#616161]">{a.eleves} élèves</span></p>
              ))}
            </Carte>
          </div>
        </>
      )}
    </EspaceLayout>
  );
}
