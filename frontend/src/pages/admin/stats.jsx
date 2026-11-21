import { ThumbsDown, ThumbsUp, UtensilsCrossed } from "lucide-react";
import { titreStyle } from "../../utils/tokens";
import { SEUIL_GASPI, nombre, pct } from "./statsFormat";

// Composition éditoriale du service : commandes, devenir des repas, gaspillage.
export function ResumeService({ resume: r, libelle = "Repas commandés" }) {
  const total = r.commandes || 1;
  const segments = [
    { cle: "termines", label: "Terminés", n: r.termines, cls: "bg-white" },
    { cle: "non_termines", label: "Non terminés", n: r.non_termines, cls: "bg-[#FF5A5F]" },
    { cle: "sans_retour", label: "Sans retour", n: r.sans_retour, cls: "bg-white/20" },
  ];
  const eleve = r.taux_gaspillage != null && r.taux_gaspillage > SEUIL_GASPI;
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="rounded-[22px] bg-[#222222] p-6 text-white sm:p-8">
        <p className="text-[13px] text-white/60">{libelle}</p>
        <p className="mt-3 text-[64px] font-semibold leading-none sm:text-[80px]" style={titreStyle}>{nombre(r.commandes)}</p>
        <p className="mt-3 text-[14px] text-white/70">
          dont <span className="font-medium text-white">{nombre(r.servis)} servis</span>
        </p>
        <div className="mt-7 flex h-2 gap-0.5 overflow-hidden rounded-full bg-white/10" role="img"
          aria-label={segments.map((s) => `${s.label} : ${s.n}`).join(", ")}>
          {r.commandes > 0 && segments.map((s) => s.n > 0 && (
            <div key={s.cle} className={`h-full ${s.cls} transition-[width] duration-500`} style={{ width: `${(100 * s.n) / total}%` }} />
          ))}
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3">
          {segments.map((s) => (
            <div key={s.cle} className="min-w-0">
              <dt className="flex items-start gap-1.5 text-[12px] leading-tight text-white/60">
                <span className={`mt-[3px] h-2 w-2 shrink-0 rounded-full ${s.cls}`} aria-hidden="true" />
                <span>{s.label}</span>
              </dt>
              <dd className="mt-1 text-[22px] font-semibold leading-none" style={titreStyle}>{nombre(s.n)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col justify-between rounded-[22px] border border-[#EBEBEB] p-6 sm:p-8">
        <div>
          <p className="text-[13px] text-[#717171]">Taux de gaspillage</p>
          <p className={`mt-3 text-[56px] font-semibold leading-none ${eleve ? "text-[#B30000]" : "text-[#222222]"}`} style={titreStyle}>
            {pct(r.taux_gaspillage)}
          </p>
          {eleve && <p className="mt-2 text-[13px] font-medium text-[#B30000]">Au-dessus de {SEUIL_GASPI} %</p>}
        </div>
        <div className="mt-6 space-y-2 border-t border-[#EBEBEB] pt-4 text-[13px] leading-relaxed text-[#717171]">
          <p>
            <span className="font-medium text-[#222222]">{nombre(r.non_termines)} non terminés</span> sur {nombre(r.commandes)} commandés.
          </p>
          {r.sans_retour > 0 && (
            <p>{nombre(r.sans_retour)} repas sans retour d'assiette : ni terminés, ni comptés dans le gaspillage.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Photo({ src, taille = 56 }) {
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[#F7F7F7] text-[#B0B0B0]"
      style={{ width: taille, height: taille }}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <UtensilsCrossed size={20} strokeWidth={1.5} />}
    </span>
  );
}

// Likes, dislikes et ratio d'appréciation d'un plat.
export function LigneAvis({ a, rang }) {
  const votes = a.likes + a.dislikes;
  return (
    <li className="flex items-center gap-4 py-4">
      {rang != null && <span className="w-5 shrink-0 text-[15px] font-semibold text-[#B0B0B0]" style={titreStyle}>{rang}</span>}
      <Photo src={a.photo} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[15px] font-medium text-[#222222]">{a.plat_nom}</p>
          <p className="shrink-0 text-[15px] font-semibold text-[#222222]" style={titreStyle}>{pct(a.ratio)}</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EBEBEB]">
          {votes > 0 && <div className="h-full rounded-full bg-[#FF5A5F]" style={{ width: `${(100 * a.likes) / votes}%` }} />}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#717171]">
          <span className="inline-flex items-center gap-1.5"><ThumbsUp size={14} aria-hidden="true" />{a.likes}<span className="sr-only"> j'aime</span></span>
          <span className="inline-flex items-center gap-1.5"><ThumbsDown size={14} aria-hidden="true" />{a.dislikes}<span className="sr-only"> je n'aime pas</span></span>
          <span className="text-[#B0B0B0]">{a.commandes} commandés</span>
        </p>
      </div>
    </li>
  );
}

export function AvisPlats({ avis, vide = "Aucun avis pour le moment." }) {
  if (!avis.length) return <p className="py-6 text-[14px] text-[#717171]">{vide}</p>;
  return <ul className="divide-y divide-[#EBEBEB]">{avis.map((a) => <LigneAvis key={a.plat_id} a={a} />)}</ul>;
}

// Histogramme compact : une barre par jour, valeurs en pourcentage.
export function Barres({ points, valeur, couleur = "bg-[#FF5A5F]", libelle, vide = "Pas encore de données." }) {
  const pts = points.filter((p) => valeur(p) != null);
  if (!pts.length) return <p className="py-6 text-[14px] text-[#717171]">{vide}</p>;
  const max = Math.max(...pts.map(valeur), 1);
  return (
    <div role="img" aria-label={`${libelle} : ${pts.map((p) => `${Number(p.date.slice(8))} : ${nombre(valeur(p))} %`).join(", ")}`}>
      <div className="flex h-36 items-end gap-[3px]">
        {pts.map((p) => (
          <div key={p.date} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div className={`w-full rounded-t-[4px] ${couleur} transition-[height] duration-500`}
              style={{ height: `${Math.max(3, (100 * valeur(p)) / max)}%` }} />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[#222222] px-2 py-0.5 text-[11px] text-white group-hover:block">
              {nombre(valeur(p))} %
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px]" aria-hidden="true">
        {pts.map((p, i) => (
          <span key={p.date} className="min-w-0 flex-1 text-center text-[10px] text-[#B0B0B0]">
            {i % 2 === 0 || pts.length < 12 ? Number(p.date.slice(8)) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Etat({ chargement, erreur, onRetry }) {
  if (chargement) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]" aria-busy="true" aria-label="Chargement">
        <div className="h-[300px] animate-pulse rounded-[22px] bg-[#F7F7F7]" />
        <div className="h-[300px] animate-pulse rounded-[22px] bg-[#F7F7F7]" />
      </div>
    );
  }
  if (erreur) {
    return (
      <div role="alert" className="rounded-[22px] bg-[#FFF0ED] p-6">
        <p className="text-[15px] font-medium text-[#B30000]">{erreur}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-3 h-11 rounded-full bg-[#222222] px-5 text-[14px] font-medium text-white">
            Réessayer
          </button>
        )}
      </div>
    );
  }
  return null;
}
