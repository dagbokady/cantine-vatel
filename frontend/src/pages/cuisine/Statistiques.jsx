import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp, Utensils } from "lucide-react";
import { erreurApi, getStatsCuisine } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import ChampDate from "../admin/ChampDate";
import { Etat, ResumeService } from "../admin/stats";
import { nombre, pct } from "../admin/statsFormat";
import NotificationsCommandes from "./Notifications";
import { ONGLETS_CUISINE } from "./onglets";
import { TableauPortions } from "./portions";
import { useReglages } from "./reglages";

const PERIODES = [["jour", "Jour"], ["semaine", "Semaine"], ["mois", "Mois"]];
const court = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

function Repartition({ par, total }) {
  return (
    <div>
      <div className="flex h-3 gap-1 overflow-hidden rounded-full" role="img"
        aria-label={[1, 2, 3].map((t) => `${tiersEnFraction(t)} : ${par[t] ?? 0}`).join(", ")}>
        {[1, 2, 3].map((t) => (par[t] ?? 0) > 0 && (
          <div key={t} className={t === 3 ? "bg-[#222222]" : t === 2 ? "bg-[#FF5A5F]" : "bg-[#B0B0B0]"} style={{ width: `${(100 * par[t]) / (total || 1)}%` }} />
        ))}
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((t) => (
          <div key={t}>
            <dt className="flex items-center gap-2 text-[13px] text-[#717171]">
              <span className={`h-2.5 w-2.5 rounded-full ${t === 3 ? "bg-[#222222]" : t === 2 ? "bg-[#FF5A5F]" : "bg-[#B0B0B0]"}`} aria-hidden="true" />
              Portion {tiersEnFraction(t)}
            </dt>
            <dd className="mt-1 text-[32px] font-semibold leading-none text-[#222222]" style={titreStyle}>{par[t] ?? 0}</dd>
            <dd className="mt-1 text-[12px] text-[#B0B0B0]">{total ? Math.round((100 * (par[t] ?? 0)) / total) : 0} %</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CartePlatStats({ p }) {
  const votes = p.likes + p.dislikes;
  return (
    <article className={`flex flex-col rounded-[26px] p-3 sm:p-4 ${p.special ? "bg-[#FFF0ED]" : "border border-[#EBEBEB]"}`}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] bg-[#F7F7F7]">
        {p.photo ? <img src={p.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center text-[#B0B0B0]"><Utensils size={28} /></div>}
        {p.special && <span className="absolute left-3 top-3 rounded-full bg-[#222222] px-3 py-1 text-[12px] font-medium text-white">Plat spécial</span>}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <h3 className="min-w-0 text-[17px] font-semibold leading-snug text-[#222222]" style={titreStyle}>{p.plat_nom}</h3>
        <p className="shrink-0 text-right">
          <span className="block text-[30px] font-semibold leading-none" style={titreStyle}>{p.commandes}</span>
          <span className="text-[12px] text-[#717171]">{nombre(p.portions)} portions</span>
        </p>
      </div>
      <div className="px-1">
        <TableauPortions par={p.par_portion} className="mt-3" sombre={p.special} />
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#222222]/10 pt-3 text-[13px]">
          <div>
            <p className="text-[#717171]">Gaspillage</p>
            <p className="text-[18px] font-semibold text-[#222222]" style={titreStyle}>{pct(p.taux_gaspillage)}</p>
            <p className="text-[12px] text-[#B0B0B0]">{p.non_termines} non terminés</p>
          </div>
          <div>
            <p className="text-[#717171]">Appréciation</p>
            <p className="text-[18px] font-semibold text-[#222222]" style={titreStyle}>{votes ? pct(p.ratio) : "–"}</p>
            <p className="flex gap-3 text-[12px] text-[#717171]">
              <span className="inline-flex items-center gap-1"><ThumbsUp size={12} aria-hidden="true" />{p.likes}</span>
              <span className="inline-flex items-center gap-1"><ThumbsDown size={12} aria-hidden="true" />{p.dislikes}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function StatistiquesCuisine() {
  const { mode } = useReglages();
  const [periode, setPeriode] = useState("semaine");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("sv-SE"));
  const [res, setRes] = useState({ cle: null, d: null, erreur: "" });
  const [essai, setEssai] = useState(0);
  const cle = `${periode}:${date}:${mode ?? ""}:${essai}`;

  useEffect(() => {
    let actif = true;
    getStatsCuisine({ periode, date, mode })
      .then((d) => actif && setRes({ cle, d, erreur: "" }))
      .catch((e) => actif && setRes({ cle, d: null, erreur: erreurApi(e, "Statistiques indisponibles.") }));
    return () => { actif = false; };
  }, [cle, periode, date, mode]);

  const d = res.cle === cle ? res.d : null;
  const erreur = res.cle === cle ? res.erreur : "";
  const total = d ? d.par_portion[1] + d.par_portion[2] + d.par_portion[3] : 0;
  const titrePeriode = d && (d.debut === d.fin ? court(d.debut) : `du ${court(d.debut)} au ${court(d.fin)}`);

  return (
    <EspaceLayout large titre="Statistiques" surTitre="Organiser et ajuster les quantités" onglets={ONGLETS_CUISINE}
      outils={<NotificationsCommandes />}>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Période" className="flex h-11 rounded-full bg-[#F7F7F7] p-1">
          {PERIODES.map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={periode === v} onClick={() => setPeriode(v)}
              className={`h-9 rounded-full px-4 text-[14px] font-medium transition-colors ${periode === v ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(34,34,34,0.12)]" : "text-[#717171]"}`}>
              {l}
            </button>
          ))}
        </div>
        <ChampDate value={date} onChange={(v) => v && setDate(v)} />
      </div>

      <Etat chargement={!d && !erreur} erreur={erreur} onRetry={() => setEssai((n) => n + 1)} />
      {d && (
        <>
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-end">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">{titrePeriode}</p>
              <p className="mt-3 text-[64px] font-semibold leading-none text-[#222222] sm:text-[80px]" style={titreStyle}>{d.resume.commandes}</p>
              <p className="mt-2 text-[16px] text-[#717171]">
                commandes, soit <span className="font-semibold text-[#222222]">{nombre(d.portions_equivalentes)} portions</span> équivalentes
                {d.speciaux > 0 && <>, dont <span className="font-semibold text-[#FF5A5F]">{d.speciaux} plats spéciaux</span></>}.
              </p>
            </div>
            <div className="rounded-[22px] border border-[#EBEBEB] p-6">
              <p className="mb-4 text-[13px] text-[#717171]">Répartition des portions</p>
              <Repartition par={d.par_portion} total={total} />
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[24px] font-semibold text-[#222222]" style={titreStyle}>Par plat</h2>
            <p className="text-[14px] text-[#717171]">Quantités commandées, gaspillage et appréciation</p>
            {d.plats.length === 0 ? (
              <p className="mt-4 rounded-[22px] bg-[#F7F7F7] p-6 text-[14px] text-[#717171]">Aucune commande sur cette période.</p>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {d.plats.map((p) => <CartePlatStats key={p.plat_id} p={p} />)}
              </div>
            )}
          </section>

          {d.resume.commandes > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-[24px] font-semibold text-[#222222]" style={titreStyle}>Retours d'assiettes</h2>
              <ResumeService resume={d.resume} />
            </section>
          )}
        </>
      )}
    </EspaceLayout>
  );
}
