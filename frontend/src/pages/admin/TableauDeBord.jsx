import { useEffect, useState } from "react";
import { getDashboard } from "../../api/pro";
import EspaceLayout, { Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { fcfa, formatHeure } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";
import ChampDate from "./ChampDate";

const n = (x) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

function Tuile({ label, valeur }) {
  return (
    <div className="py-1">
      <p className="text-[28px] font-semibold leading-none text-[#222222]" style={titreStyle}>{valeur}</p>
      <p className="mt-1.5 text-[13px] text-[#717171]">{label}</p>
    </div>
  );
}

function Barre({ label, valeur, max, detail }) {
  const pct = max ? Math.min(100, (100 * valeur) / max) : 0;
  return (
    <div className="py-2.5">
      <div className="flex justify-between gap-3 text-[14px]">
        <span className="font-medium text-[#222222]">{label}</span>
        <span className="text-[#717171]">{detail}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F7F7F7]">
        <div className="h-full rounded-full bg-[#FF5A5F] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TableauDeBord() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [d, setD] = useState(null);
  useEffect(() => { getDashboard(date).then(setD).catch(() => setD(null)); }, [date]);

  const p = d?.portions;
  const gaspiEleve = p && p.taux_gaspillage > 20;

  return (
    <EspaceLayout titre="Tableau de bord" surTitre="Pilotage du service" onglets={ONGLETS_ADMIN} large
      action={<ChampDate value={date} onChange={setDate} />}>
      {!d && <p className="text-[14px] text-[#B0B0B0]">Chargement…</p>}
      {d && (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
            <div className="flex flex-col justify-between rounded-[22px] bg-[#222222] p-6 text-white">
              <p className="text-[13px] text-white/60">Portions servies</p>
              <div className="mt-6">
                <p className="text-[64px] font-semibold leading-none" style={titreStyle}>{n(p.servies)}</p>
                <p className="mt-2 text-[14px] text-white/60">sur {n(p.commandees)} commandées · {n(p.preparees)} préparées</p>
              </div>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-[#FF5A5F]" style={{ width: `${p.commandees ? Math.min(100, (100 * p.servies) / p.commandees) : 0}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-[22px] border border-[#EBEBEB] p-6 sm:grid-cols-4 lg:grid-cols-2 lg:content-center">
              <Tuile label="Restantes" valeur={n(p.restantes)} />
              <Tuile label="Sauvées (anti-gaspi)" valeur={n(p.sauvees)} />
              <div className="py-1">
                <p className={`text-[28px] font-semibold leading-none ${gaspiEleve ? "text-[#B30000]" : "text-[#222222]"}`} style={titreStyle}>
                  {n(p.taux_gaspillage)} %
                </p>
                <p className="mt-1.5 text-[13px] text-[#717171]">Gaspillage{gaspiEleve && " · au-dessus de 20 %"}</p>
              </div>
              <Tuile label="Occupation de la salle" valeur={`${n(d.occupation_salle)} %`} />
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Carte>
              <Libelle>Affluence par créneau</Libelle>
              {d.creneaux.length === 0 && <p className="mt-3 text-[14px] text-[#717171]">Aucun créneau.</p>}
              <div className="mt-2">
                {d.creneaux.map((c) => (
                  <Barre key={c.heure_debut} label={`${formatHeure(c.heure_debut)} – ${formatHeure(c.heure_fin)}`}
                    valeur={c.commandes} max={c.capacite} detail={`${c.commandes}/${c.capacite} · ${c.servies} servis`} />
                ))}
              </div>
            </Carte>
            <Carte>
              <Libelle>Présence par classe</Libelle>
              {d.presence_par_classe.length === 0 && <p className="mt-3 text-[14px] text-[#717171]">Aucun appel.</p>}
              <div className="mt-2">
                {d.presence_par_classe.map((c) => (
                  <Barre key={c.classe} label={c.classe} valeur={c.presents} max={c.attendus} detail={`${c.presents}/${c.attendus}`} />
                ))}
              </div>
            </Carte>
            <Carte className="bg-[#FFF0ED] border-transparent">
              <Libelle>Recettes du jour</Libelle>
              <p className="mt-3 text-[34px] font-semibold leading-none" style={titreStyle}>{fcfa(d.recettes.ventes)}</p>
              <p className="mt-1.5 text-[13px] text-[#717171]">de repas commandés</p>
              <p className="mt-4 text-[18px] font-semibold" style={titreStyle}>{fcfa(d.recettes.recharges)}</p>
              <p className="text-[13px] text-[#717171]">de recharges validées</p>
              <div className="mt-6 border-t border-[#222222]/10 pt-4">
                <Libelle>Allergies déclarées</Libelle>
                {d.allergies.length === 0 && <p className="mt-2 text-[14px] text-[#717171]">Aucune.</p>}
                {d.allergies.map((a) => (
                  <p key={a.allergene} className="flex justify-between py-1 text-[14px]">
                    <span className="capitalize">{a.allergene}</span>
                    <span className="text-[#717171]">{a.eleves} élève{a.eleves > 1 ? "s" : ""}</span>
                  </p>
                ))}
              </div>
            </Carte>
          </div>
        </>
      )}
    </EspaceLayout>
  );
}
