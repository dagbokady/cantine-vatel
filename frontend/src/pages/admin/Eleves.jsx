import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Pencil, Plus, Search, ShieldAlert, X } from "lucide-react";
import {
  creerClasse, creerEleve, erreurApi, getClassesScolarite, getElevesScolarite, getNiveaux, majClasse, majEleve,
} from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Champ } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { Avatar } from "../../components/ui";
import { MATRICULE_ERREUR, matriculeValide, normaliserMatricule } from "../../utils/matricule";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";

const champSelect =
  "mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-4 text-[16px] text-[#222222] outline-none focus:border-[#222222]";

function FormClasse({ classe, niveaux, onClose, onSaved }) {
  const [f, setF] = useState({ nom: classe?.nom ?? "", niveau_id: classe?.niveau_id ?? niveaux[0]?.id ?? "" });
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const valider = async () => {
    setEnvoi(true);
    setErr("");
    try {
      const body = { nom: f.nom.trim(), niveau_id: Number(f.niveau_id) };
      onSaved(classe ? await majClasse(classe.id, body) : await creerClasse(body), !classe);
    } catch (e) {
      setErr(erreurApi(e));
      setEnvoi(false);
    }
  };
  return (
    <Panneau ouvert onClose={onClose} titre={classe ? classe.nom : "Nouvelle classe"} surTitre={classe ? "Modifier la classe" : "Ajouter"}
      pied={<Bouton className="w-full" disabled={!f.nom.trim() || !f.niveau_id || envoi} onClick={valider}>
        {envoi ? "Enregistrement…" : classe ? "Enregistrer" : "Créer la classe"}
      </Bouton>}>
      <div className="space-y-4">
        <Champ label="Nom de la classe" autoFocus value={f.nom} maxLength={32} placeholder="2nde C"
          onChange={(e) => setF({ ...f, nom: e.target.value })} />
        <label className="block">
          <span className="text-[13px] font-medium text-[#222222]">Niveau</span>
          <select className={champSelect} value={f.niveau_id} onChange={(e) => setF({ ...f, niveau_id: e.target.value })}>
            {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom} · mode {n.mode}</option>)}
          </select>
        </label>
        {classe && classe.effectif > 0 && f.nom.trim() && f.nom.trim() !== classe.nom && (
          <p className="text-[13px] text-[#717171]">Les {classe.effectif} élèves de la classe suivront le nouveau nom.</p>
        )}
        <Alerte>{err}</Alerte>
      </div>
    </Panneau>
  );
}

function FormEleve({ eleve, classes, classeDefaut, onClose, onSaved }) {
  const [f, setF] = useState({
    matricule: eleve?.matricule ?? "",
    nom: eleve?.nom ?? "",
    classe_id: eleve?.classe_id ?? classeDefaut ?? classes[0]?.id ?? "",
  });
  const [touche, setTouche] = useState(false);
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);
  // Un matricule historique non modifié reste accepté ; toute nouvelle saisie doit respecter le format.
  const inchange = eleve && f.matricule === eleve.matricule;
  const matOk = inchange || matriculeValide(f.matricule);
  const ok = matOk && f.nom.trim().length >= 2 && f.classe_id;

  const valider = async () => {
    setEnvoi(true);
    setErr("");
    try {
      const body = { matricule: f.matricule, nom: f.nom.trim(), classe_id: Number(f.classe_id) };
      onSaved(eleve ? await majEleve(eleve.id, body) : await creerEleve(body), !eleve);
    } catch (e) {
      setErr(erreurApi(e));
      setEnvoi(false);
    }
  };

  return (
    <Panneau ouvert onClose={onClose} titre={eleve ? eleve.nom : "Nouvel élève"} surTitre={eleve ? "Modifier l'élève" : "Ajouter"}
      pied={<Bouton className="w-full" disabled={!ok || envoi} onClick={valider}>
        {envoi ? "Enregistrement…" : eleve ? "Enregistrer" : "Ajouter l'élève"}
      </Bouton>}>
      <div className="space-y-4">
        <div>
          <Champ label="Matricule" autoFocus={!eleve} value={f.matricule} placeholder="15079766N" inputMode="text"
            autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={inchange ? 32 : 9}
            aria-invalid={touche && !matOk} aria-describedby="aide-matricule"
            onBlur={() => setTouche(true)}
            onChange={(e) => setF({ ...f, matricule: eleve && e.target.value === eleve.matricule ? e.target.value : normaliserMatricule(e.target.value) })} />
          <p id="aide-matricule" className={`mt-1.5 text-[12px] ${touche && !matOk ? "text-[#B30000]" : "text-[#B0B0B0]"}`}>
            {touche && !matOk ? `Matricule invalide : ${MATRICULE_ERREUR}` : MATRICULE_ERREUR}
          </p>
        </div>
        <Champ label="Nom et prénoms" value={f.nom} maxLength={120} placeholder="Awa Koné"
          onChange={(e) => setF({ ...f, nom: e.target.value })} />
        <label className="block">
          <span className="text-[13px] font-medium text-[#222222]">Classe</span>
          <select className={champSelect} value={f.classe_id} onChange={(e) => setF({ ...f, classe_id: e.target.value })}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom} · {c.niveau}</option>)}
          </select>
        </label>
        {eleve && (
          <p className="flex gap-2 rounded-[14px] bg-[#F7F7F7] px-4 py-3 text-[13px] text-[#717171]">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Les allergies et le régime sont déclarés par le parent et ne se modifient pas ici.
          </p>
        )}
        <Alerte>{err}</Alerte>
      </div>
    </Panneau>
  );
}

function LigneEleve({ e, onOuvrir, afficherClasse }) {
  const ancien = !matriculeValide(e.matricule);
  return (
    <li>
      <button type="button" onClick={() => onOuvrir(e)}
        className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:bg-[#F7F7F7] sm:gap-4 sm:px-3 sm:-mx-3 sm:rounded-[14px]">
        <Avatar nom={e.nom} photo={e.photo} taille={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-[#222222]">{e.nom}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-[#717171]">
            <span className="font-mono tracking-tight">{e.matricule}</span>
            {ancien && <span className="text-[12px] text-[#B0B0B0]">ancien format</span>}
            {afficherClasse && <span>· {e.classe}</span>}
          </p>
        </div>
        {e.allergies.length > 0 && (
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#FFF0ED] px-2.5 py-1 text-[12px] font-medium text-[#B30000] sm:inline-flex">
            <ShieldAlert size={13} aria-hidden="true" />{e.allergies.join(", ")}
          </span>
        )}
        <ChevronRight size={18} className="shrink-0 text-[#B0B0B0]" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function Eleves() {
  const [classes, setClasses] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [selection, setSelection] = useState(null);
  const [q, setQ] = useState("");
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [panneau, setPanneau] = useState(null); // { type: "classe" | "eleve", objet }

  useEffect(() => {
    Promise.all([getClassesScolarite(), getNiveaux()])
      .then(([c, n]) => { setClasses(c); setNiveaux(n); setSelection((s) => s ?? c[0]?.id ?? null); })
      .catch((e) => setErreur(erreurApi(e, "Impossible de charger les classes.")));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setRecherche(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const [liste, setListe] = useState({ cle: null, eleves: null });
  const [version, setVersion] = useState(0);
  const cleListe = recherche ? `q:${recherche}` : selection != null ? `c:${selection}` : null;
  useEffect(() => {
    if (!cleListe) return undefined;
    let actif = true;
    getElevesScolarite(recherche ? { q: recherche } : { classe_id: selection })
      .then((l) => actif && setListe({ cle: cleListe, eleves: l }))
      .catch((e) => { if (actif) { setListe({ cle: cleListe, eleves: [] }); setErreur(erreurApi(e, "Impossible de charger les élèves.")); } });
    return () => { actif = false; };
  }, [cleListe, recherche, selection, version]);
  const eleves = liste.cle === cleListe ? liste.eleves : null;
  const chargerEleves = () => setVersion((v) => v + 1);

  const classe = useMemo(() => classes?.find((c) => c.id === selection), [classes, selection]);

  const flash = (t) => { setSucces(t); setTimeout(() => setSucces(""), 3500); };

  const classeEnregistree = (c, nouvelle) => {
    setClasses((l) => (nouvelle ? [...l, c] : l.map((x) => (x.id === c.id ? c : x))));
    setSelection(c.id);
    setPanneau(null);
    flash(nouvelle ? `Classe ${c.nom} créée.` : `Classe ${c.nom} enregistrée.`);
    if (!nouvelle) chargerEleves();
  };

  const eleveEnregistre = (e, nouveau) => {
    setPanneau(null);
    flash(nouveau ? `${e.nom} ajouté(e) en ${e.classe}.` : `${e.nom} enregistré(e).`);
    getClassesScolarite().then(setClasses).catch(() => {});
    chargerEleves();
  };

  return (
    <EspaceLayout large onglets={ONGLETS_ADMIN} surTitre="Scolarité" titre="Élèves et classes"
      action={classes?.length > 0 && (
        <BoutonAction icone={Plus} onClick={() => setPanneau({ type: "eleve", objet: null })}>Ajouter un élève</BoutonAction>
      )}>
      {succes && <p role="status" className="mb-4 rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] font-medium text-[#222222]">{succes}</p>}
      {erreur && <div className="mb-4"><Alerte>{erreur}</Alerte></div>}
      {!classes && !erreur && <div className="h-40 animate-pulse rounded-[22px] bg-[#F7F7F7]" aria-busy="true" />}

      {classes && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF5A5F]">Classes · {classes.length}</p>
              <button type="button" onClick={() => setPanneau({ type: "classe", objet: null })}
                className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[#222222] hover:bg-[#F7F7F7]">
                <Plus size={15} aria-hidden="true" />Nouvelle
              </button>
            </div>
            {classes.length === 0 ? (
              <p className="rounded-[22px] bg-[#F7F7F7] p-5 text-[14px] text-[#717171]">Créez une première classe pour y ajouter des élèves.</p>
            ) : (
              <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0">
                {classes.map((c) => {
                  const actif = !recherche && c.id === selection;
                  return (
                    <li key={c.id} className="shrink-0">
                      <button type="button" aria-pressed={actif} onClick={() => { setQ(""); setRecherche(""); setSelection(c.id); }}
                        className={`flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[14px] transition-colors lg:h-auto lg:w-full lg:justify-between lg:rounded-[14px] lg:px-4 lg:py-3 ${
                          actif ? "border-[#FF5A5F] bg-[#FFF0ED] font-medium text-[#222222]" : "border-[#EBEBEB] text-[#222222] hover:border-[#222222] lg:border-transparent"
                        }`}>
                        <span>{c.nom}</span>
                        <span className="text-[12px] text-[#717171]">{c.effectif}<span className="hidden lg:inline"> élèves · {c.niveau}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="min-w-0">
            <label className="relative block">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#717171]" aria-hidden="true" />
              <span className="sr-only">Rechercher un élève par nom ou matricule</span>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou matricule"
                className="h-12 w-full rounded-full border border-[#EBEBEB] bg-[#F7F7F7] pl-11 pr-11 text-[16px] text-[#222222] outline-none transition-colors placeholder:text-[#B0B0B0] focus:border-[#222222] focus:bg-white" />
              {q && (
                <button type="button" onClick={() => setQ("")} aria-label="Effacer la recherche"
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#717171] hover:bg-[#EBEBEB]">
                  <X size={16} />
                </button>
              )}
            </label>

            <div className="mb-2 mt-7 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                {recherche ? (
                  <>
                    <p className="text-[13px] text-[#717171]">Recherche dans toutes les classes</p>
                    <h2 className="mt-1 truncate text-[28px] font-semibold leading-tight" style={titreStyle}>« {recherche} »</h2>
                  </>
                ) : classe && (
                  <>
                    <p className="text-[13px] text-[#717171]">{classe.niveau} · mode {classe.mode}</p>
                    <h2 className="mt-1 text-[32px] font-semibold leading-tight" style={titreStyle}>{classe.nom}</h2>
                  </>
                )}
              </div>
              {!recherche && classe && (
                <BoutonAction variante="doux" icone={Pencil} onClick={() => setPanneau({ type: "classe", objet: classe })}>
                  Modifier
                </BoutonAction>
              )}
            </div>

            {eleves === null && (recherche || selection != null) && (
              <div className="space-y-3 pt-3" aria-busy="true">
                {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-[#F7F7F7]" />)}
              </div>
            )}
            {eleves?.length === 0 && (
              <div className="mt-3 rounded-[22px] bg-[#F7F7F7] p-6 text-[14px] text-[#717171]">
                {recherche ? "Aucun élève ne correspond à cette recherche." : "Aucun élève dans cette classe."}
              </div>
            )}
            {eleves?.length > 0 && (
              <ul className="divide-y divide-[#EBEBEB]">
                {eleves.map((e) => (
                  <LigneEleve key={e.id} e={e} afficherClasse={!!recherche} onOuvrir={(x) => setPanneau({ type: "eleve", objet: x })} />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {panneau?.type === "classe" && (
        <FormClasse classe={panneau.objet} niveaux={niveaux} onClose={() => setPanneau(null)} onSaved={classeEnregistree} />
      )}
      {panneau?.type === "eleve" && (
        <FormEleve eleve={panneau.objet} classes={classes} classeDefaut={recherche ? undefined : selection}
          onClose={() => setPanneau(null)} onSaved={eleveEnregistre} />
      )}
    </EspaceLayout>
  );
}
