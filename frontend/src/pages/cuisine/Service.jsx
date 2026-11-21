import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight, LayoutGrid, Minus, Plus, ThumbsUp, Timer, Utensils } from "lucide-react";
import { erreurApi, getService, getVague, majReglagesCuisine } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import Panneau from "../../components/Panneau";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { BarreProgression, FicheEleve, Puce, PuceAllergie, Reglages } from "./commun";
import { MODE_LIBELLE, dateLongue, heureVague, portions, useReglages } from "./reglages";
import { ONGLETS_CUISINE } from "./onglets";
import NotificationsCommandes from "./Notifications";
import { TableauPortions } from "./portions";

function Repartition({ par }) {
  const entrees = Object.entries(par || {}).sort((a, b) => b[0] - a[0]);
  if (!entrees.length) return null;
  return (
    <p className="text-[13px] text-[#717171]">
      {entrees.map(([t, n]) => `${n} × ${tiersEnFraction(Number(t))}`).join("  ·  ")}
    </p>
  );
}

function PhotoPlat({ src, children }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-[#F7F7F7]">
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[#B0B0B0]"><Utensils size={30} /></div>
      )}
      {children}
    </div>
  );
}

function CartePlat({ p }) {
  return (
    <article className="flex flex-col">
      <PhotoPlat src={p.photo}>
        {p.type === "accompagnement" && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#222222]">Accompagnement</span>
        )}
      </PhotoPlat>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-[18px] font-semibold leading-snug text-[#222222]" style={titreStyle}>{p.plat_nom}</h3>
        <p className="shrink-0 text-right">
          <span className="block text-[34px] font-semibold leading-none text-[#222222]" style={titreStyle}>{p.couverts}</span>
          <span className="text-[12px] text-[#717171]">assiettes</span>
        </p>
      </div>
      <p className="mt-1 text-[13px] text-[#717171]">{portions(p.portions)} portions équivalentes · stock {portions(p.stock_prevu)}</p>
      <TableauPortions par={p.par_portion} className="mt-3" />
      {p.particularites.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.particularites.map((x) => <Puce key={x.libelle} ton="rose">{x.nb} × {x.libelle}</Puce>)}
        </div>
      )}
      {p.allergenes.length > 0 && <p className="mt-3 text-[13px] text-[#B30000]">Contient : {p.allergenes.join(", ")}</p>}
    </article>
  );
}

// Plat spécial : même photo que le plat classique, fond rose poudré, exclusions en évidence.
function CarteSpecial({ p, compact }) {
  const [tous, setTous] = useState(false);
  const visibles = tous ? p.eleves : p.eleves.slice(0, 4);
  return (
    <article className="flex flex-col rounded-[26px] bg-[#FFF0ED] p-3 sm:p-4">
      {!compact && (
        <PhotoPlat src={p.photo}>
          <span className="absolute left-3 top-3 rounded-full bg-[#222222] px-3 py-1 text-[12px] font-medium text-white">Plat spécial</span>
        </PhotoPlat>
      )}
      <div className={`px-1 ${compact ? "" : "mt-4"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold leading-snug text-[#222222]" style={titreStyle}>{p.plat_nom}</h3>
            {p.remplace && <p className="mt-0.5 text-[13px] text-[#717171]">Variante de {p.remplace}</p>}
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-[34px] font-semibold leading-none text-[#222222]" style={titreStyle}>{p.couverts}</span>
            <span className="text-[12px] text-[#717171]">portion{p.couverts > 1 ? "s" : ""}</span>
          </p>
        </div>
        {p.evite.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-medium text-[#222222]">À exclure</span>
            {p.evite.map((a) => <PuceAllergie key={a}>Sans {a}</PuceAllergie>)}
          </div>
        )}
        {p.particularites?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.particularites.map((x) => <Puce key={x.libelle} ton="contour">{x.nb} × {x.libelle}</Puce>)}
          </div>
        )}
        <TableauPortions par={p.par_portion} className="mt-3" sombre />
        {!compact && p.eleves.length > 0 && (
          <ul className="mt-3 divide-y divide-[#222222]/10 border-t border-[#222222]/10">
            {visibles.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <span className="min-w-0 truncate text-[#222222]">{e.nom} <span className="text-[#717171]">· {e.classe}</span></span>
                <span className="shrink-0 text-[13px] text-[#B30000]">{e.allergies.join(", ")} · {tiersEnFraction(e.tiers)}</span>
              </li>
            ))}
            {p.eleves.length > 4 && (
              <li className="pt-2.5">
                <button type="button" onClick={() => setTous(!tous)} className="text-[13px] font-medium text-[#222222] underline underline-offset-4">
                  {tous ? "Réduire" : `Voir les ${p.eleves.length} élèves`}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}

function ReglageDelai({ delai, vagues, onSaved }) {
  const [ouvert, setOuvert] = useState(false);
  const [valeur, setValeur] = useState(delai);
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const prochaine = vagues.find((v) => v.heure_debut && v.heure_debut.slice(0, 5) > new Date().toTimeString().slice(0, 5)) ?? vagues[0];
  const limite = (debut) => {
    const [h, m] = debut.split(":").map(Number);
    const t = Math.max(0, h * 60 + m - valeur);
    return `${String(Math.floor(t / 60)).padStart(2, "0")} h ${String(t % 60).padStart(2, "0")}`;
  };
  const enregistrer = async () => {
    setEnvoi(true);
    try { onSaved((await majReglagesCuisine(valeur)).delai_preparation_min); setOuvert(false); setErr(""); }
    catch (e) { setErr(erreurApi(e)); }
    finally { setEnvoi(false); }
  };
  return (
    <>
      <button type="button" onClick={() => { setValeur(delai); setOuvert(true); }}
        className="flex h-11 items-center gap-2 rounded-full border border-[#EBEBEB] px-4 text-[14px] text-[#222222] transition-colors hover:border-[#222222]">
        <Timer size={16} className="text-[#717171]" aria-hidden="true" />
        Préparation <span className="font-semibold">{delai} min</span>
      </button>
      <Panneau ouvert={ouvert} onClose={() => setOuvert(false)} titre="Délai de préparation" surTitre="Réglage du chef"
        pied={<button type="button" disabled={envoi} onClick={enregistrer}
          className="h-12 w-full rounded-full bg-[#222222] text-[15px] font-medium text-white disabled:bg-[#EBEBEB] disabled:text-[#B0B0B0]">
          {envoi ? "Enregistrement…" : "Enregistrer"}
        </button>}>
        <p className="text-[14px] text-[#717171]">Les commandes ferment ce nombre de minutes avant le début de chaque vague. Le serveur applique la règle.</p>
        <div className="mt-6 flex items-center justify-center gap-5">
          <button type="button" aria-label="Moins 5 minutes" onClick={() => setValeur((v) => Math.max(0, v - 5))}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[#EBEBEB] text-[#222222] hover:border-[#222222]"><Minus size={20} /></button>
          <p className="w-[120px] text-center" aria-live="polite">
            <span className="block text-[56px] font-semibold leading-none text-[#222222]" style={titreStyle}>{valeur}</span>
            <span className="text-[13px] text-[#717171]">minutes</span>
          </p>
          <button type="button" aria-label="Plus 5 minutes" onClick={() => setValeur((v) => Math.min(240, v + 5))}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[#EBEBEB] text-[#222222] hover:border-[#222222]"><Plus size={20} /></button>
        </div>
        {prochaine?.heure_debut && (
          <p className="mt-6 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#222222]">
            Vague de {prochaine.heure_debut.slice(0, 5).replace(":", " h ")} : commandes jusqu'à <strong>{limite(prochaine.heure_debut)}</strong>.
          </p>
        )}
        {err && <p role="alert" className="mt-3 text-[13px] text-[#B30000]">{err}</p>}
      </Panneau>
    </>
  );
}

function LigneVague({ v, mode, onOpen }) {
  const fait = mode === "classe" ? v.evalues : v.servis;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(v.cle)}
        className="group flex w-full items-center gap-4 rounded-[22px] border border-[#EBEBEB] bg-white p-4 text-left transition-colors hover:border-[#222222] sm:p-5"
      >
        <div className="w-[72px] shrink-0">
          <p className="text-[22px] font-semibold leading-none text-[#222222]" style={titreStyle}>
            {mode === "classe" ? (v.heure_debut?.slice(0, 5) ?? "Libre") : v.nom}
          </p>
          <p className="mt-1 text-[12px] text-[#B0B0B0]">{v.sous_titre}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[#222222]">
            {mode === "classe" ? v.nom : `${v.eleves} élève${v.eleves > 1 ? "s" : ""}`}
            {mode === "classe" && <span className="font-normal text-[#717171]"> · {v.eleves} élèves</span>}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 text-[13px]">
            {v.heure_limite && <span className="text-[#717171]">Commandes jusqu'à {v.heure_limite.slice(0, 5)}</span>}
            {v.speciaux > 0 && <span className="text-[#222222]">{v.speciaux} plat{v.speciaux > 1 ? "s" : ""} spécia{v.speciaux > 1 ? "ux" : "l"}</span>}
            {v.allergiques > 0 && <span className="font-medium text-[#B30000]">⚠ {v.allergiques} allergie{v.allergiques > 1 ? "s" : ""}</span>}
          </div>
          <div className="mt-2">
            <BarreProgression valeur={fait} total={v.eleves} libelle={mode === "classe" ? "Élèves évalués" : "Élèves servis"} />
          </div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-[#B0B0B0] transition-transform group-hover:translate-x-0.5" />
      </button>
    </li>
  );
}

function DetailVague({ cle, date, mode, onChange, onClose }) {
  const navigate = useNavigate();
  const [charge, setCharge] = useState({ cle: null, v: null });
  const [eleve, setEleve] = useState(null);
  useEffect(() => {
    if (!cle) return;
    let actif = true;
    getVague(cle, date, mode)
      .then((d) => actif && setCharge({ cle, v: d }))
      .catch(() => actif && setCharge({ cle, v: false }));
    return () => { actif = false; };
  }, [cle, date, mode]);
  const v = charge.cle === cle ? charge.v : null;

  const titre = v ? (v.sous_titre === "Classe" ? v.nom : `Vague de ${v.nom}`) : "Vague";
  return (
    <>
      <Panneau
        ouvert={!!cle && !eleve}
        onClose={onClose}
        titre={titre}
        surTitre={v ? `${heureVague(v)} · ${v.eleves.length} élèves` : ""}
        cote
        pied={
          v && (
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate(`/cuisine/salle?vague=${v.cle}`)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#222222] text-[14px] font-medium text-[#222222]">
                <LayoutGrid size={16} /> En salle
              </button>
              <button type="button" onClick={() => navigate(`/cuisine/retours?vague=${v.cle}`)}
                className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-[#222222] text-[14px] font-medium text-white">
                <ThumbsUp size={16} /> Retour assiettes
              </button>
            </div>
          )
        }
      >
        {v === null && <p className="text-[14px] text-[#717171]">Chargement…</p>}
        {v === false && <p className="text-[14px] text-[#B30000]">Vague introuvable.</p>}
        {v && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button type="button" disabled={!v.precedente} onClick={() => onChange(v.precedente)} aria-label="Vague précédente"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBEBEB] disabled:opacity-30"><ArrowLeft size={18} /></button>
              <p className="text-[13px] text-[#717171]">{v.sous_titre === "Classe" ? "Changer de classe" : "Changer de vague"}</p>
              <button type="button" disabled={!v.suivante} onClick={() => onChange(v.suivante)} aria-label="Vague suivante"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#EBEBEB] disabled:opacity-30"><ArrowRight size={18} /></button>
            </div>

            <section>
              <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Plats pour tous</p>
              <ul className="mt-2 divide-y divide-[#EBEBEB]">
                {v.classiques.map((p) => (
                  <li key={p.menu_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#222222]">{p.plat_nom}</p>
                      <Repartition par={p.par_portion} />
                    </div>
                    <p className="shrink-0 text-[28px] font-semibold text-[#222222]" style={titreStyle}>{portions(p.portions)}</p>
                  </li>
                ))}
                {!v.classiques.length && <li className="py-3 text-[14px] text-[#717171]">Aucun couvert.</li>}
              </ul>
            </section>

            {v.speciaux.length > 0 && (
              <section>
                <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Plats spéciaux</p>
                <div className="mt-2 space-y-3">{v.speciaux.map((p) => <CarteSpecial key={p.menu_id} p={p} compact />)}</div>
              </section>
            )}

            <section>
              <p className="text-[12px] uppercase tracking-[0.28px] text-[#B0B0B0]">Élèves</p>
              <ul className="mt-2 divide-y divide-[#EBEBEB]">
                {v.eleves.map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setEleve(e)} className="flex w-full items-center gap-3 py-2.5 text-left">
                      <span className="min-w-0 flex-1 truncate text-[14px] text-[#222222]">{e.nom}</span>
                      {e.allergies.length > 0 && <span className="text-[12px] font-semibold text-[#B30000]">⚠ {e.allergies.join(", ")}</span>}
                      {e.menu_type === "sans_allergene" && <Puce ton="rose">Spécial</Puce>}
                      <span className="w-9 shrink-0 text-right text-[13px] tabular-nums text-[#717171]">{tiersEnFraction(e.tiers)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </Panneau>
      <FicheEleve eleve={eleve} vague={v ? titre : null} onClose={() => setEleve(null)} />
    </>
  );
}

export default function Service() {
  const { date, setDate, mode, setMode } = useReglages();
  const [s, setS] = useState(null);
  const [erreur, setErreur] = useState("");
  const [vague, setVague] = useState(null);

  const charger = useCallback(() => {
    getService(date, mode)
      .then((d) => { setS(d); setErreur(""); })
      .catch((e) => setErreur(erreurApi(e, "Service indisponible.")));
  }, [date, mode]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    const t = setInterval(charger, 30000); // suivi du service en direct
    return () => clearInterval(t);
  }, [charger]);

  const nbSpeciaux = s?.speciaux.reduce((n, p) => n + p.couverts, 0) ?? 0;

  return (
    <EspaceLayout
      titre="Service du jour"
      surTitre={s ? `${dateLongue(s.date)} · ${MODE_LIBELLE[s.mode]}` : dateLongue(date)}
      onglets={ONGLETS_CUISINE}
      large
      outils={<NotificationsCommandes />}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {s?.mode === "commande" && (
            <ReglageDelai delai={s.delai_preparation_min} vagues={s.vagues}
              onSaved={(d) => { setS((x) => ({ ...x, delai_preparation_min: d })); charger(); }} />
          )}
          <Reglages date={date} setDate={setDate} mode={s?.mode} modes={s?.modes} setMode={setMode} />
        </div>
      }
    >
      <Alerte>{erreur}</Alerte>
      {s && (
        <>
          <p className="max-w-[640px] text-[20px] leading-snug text-[#222222] sm:text-[24px]" style={titreStyle}>
            <span className="font-semibold">{s.total_eleves} assiettes</span>
            <span className="text-[#717171]"> réparties en {s.vagues.length} {s.mode === "classe" ? "classes" : "vagues"}</span>
            {nbSpeciaux > 0 && <span className="text-[#FF5A5F]">, dont {nbSpeciaux} spécia{nbSpeciaux > 1 ? "les" : "le"}</span>}.
          </p>

          {s.classiques.length === 0 && s.speciaux.length === 0 && (
            <p className="mt-8 rounded-[22px] bg-[#F7F7F7] p-6 text-[15px] text-[#717171]">
              Aucun plat à préparer ce jour-là : menu non publié ou aucune commande.
            </p>
          )}

          {s.classiques.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[22px] font-semibold text-[#222222]" style={titreStyle}>À préparer pour tous</h2>
              <p className="text-[14px] text-[#717171]">Toutes vagues confondues</p>
              <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {s.classiques.map((p) => <CartePlat key={p.menu_id} p={p} />)}
              </div>
            </section>
          )}

          {s.speciaux.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[22px] font-semibold text-[#222222]" style={titreStyle}>Plats spéciaux</h2>
              <p className="text-[14px] text-[#717171]">Préparés à part, à ne pas mélanger avec les quantités ci-dessus</p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {s.speciaux.map((p) => <CarteSpecial key={p.menu_id} p={p} />)}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-[22px] font-semibold text-[#222222]" style={titreStyle}>
              {s.mode === "classe" ? "Classes" : "Vagues de passage"}
            </h2>
            <p className="text-[14px] text-[#717171]">Touchez une {s.mode === "classe" ? "classe" : "vague"} pour voir son détail</p>
            {s.vagues.length === 0 ? (
              <p className="mt-4 text-[14px] text-[#717171]">Aucune vague définie pour cette date.</p>
            ) : (
              <ul className="mt-4 grid gap-3 lg:grid-cols-2">
                {s.vagues.map((v) => <LigneVague key={v.cle} v={v} mode={s.mode} onOpen={setVague} />)}
              </ul>
            )}
          </section>
        </>
      )}
      <DetailVague cle={vague} date={date} mode={mode} onChange={setVague} onClose={() => { setVague(null); charger(); }} />
    </EspaceLayout>
  );
}
