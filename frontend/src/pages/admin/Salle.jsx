import { useCallback, useEffect, useState } from "react";
import { Accessibility, Pencil, Plus, Trash2 } from "lucide-react";
import { creerTable, erreurApi, getClassesModeClasse, getSalleAdmin, majPlace, placerClasse, supprimerTable } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";

const champ = "mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-[15px] outline-none focus:border-[#222222]";

// Table ronde vue de dessus : chaque chaise bascule en place PMR.
function TableRonde({ table, onToggle }) {
  const n = table.places.length || 1;
  const R = 37; // % du conteneur
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[210px]">
      <div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full border border-[#EBEBEB] bg-[#F7F7F7]">
        <span className="text-[17px] font-semibold sm:text-[20px]" style={titreStyle}>{table.nom}</span>
      </div>
      {table.places.map((p, j) => {
        const a = ((360 / n) * j - 90) * (Math.PI / 180);
        return (
          <button key={p.id} type="button" aria-pressed={p.pmr} onClick={() => onToggle(p)}
            title={p.pmr ? "Place PMR" : "Place standard"}
            aria-label={`${table.nom} place ${p.numero}${p.pmr ? " (PMR)" : ""}`}
            className={`absolute flex h-9 w-9 -translate-x-1/2 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
              p.pmr ? "bg-[#FF5A5F] text-white" : "border border-[#222222] bg-white text-[#222222] hover:bg-[#FFF0ED]"
            }`}
            style={{ left: `${50 + R * Math.cos(a)}%`, top: `${50 + R * Math.sin(a)}%` }}>
            {p.pmr ? <Accessibility size={17} strokeWidth={2} /> : p.numero}
          </button>
        );
      })}
    </div>
  );
}

function FormTable({ onClose, onSave }) {
  const [f, setF] = useState({ nom: "", nb_places: 6 });
  return (
    <Panneau ouvert onClose={onClose} titre="Nouvelle table" surTitre="Ajouter"
      pied={<Bouton className="w-full" disabled={!f.nom.trim()} onClick={() => onSave(f)}>Ajouter la table</Bouton>}>
      <div className="grid grid-cols-2 gap-4">
        <label className="text-[13px] font-medium">Nom
          <input autoFocus value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="T9" className={champ} />
        </label>
        <label className="text-[13px] font-medium">Places
          <input type="number" min={1} max={12} value={f.nb_places} onChange={(e) => setF({ ...f, nb_places: Number(e.target.value) })} className={champ} />
        </label>
      </div>
    </Panneau>
  );
}

function FormClasse({ classe, tables, classes, onClose, onSave }) {
  const [heure, setHeure] = useState(classe.heure_passage?.slice(0, 5) ?? "");
  const [ids, setIds] = useState(classe.table_ids);
  const places = tables.filter((t) => ids.includes(t.id)).reduce((n, t) => n + t.places.length, 0);
  const prisePar = (tid) => classes.find((c) => c.id !== classe.id && c.table_ids.includes(tid) && c.heure_passage === classe.heure_passage);
  return (
    <Panneau ouvert onClose={onClose} titre={classe.nom} surTitre="Passage de la classe"
      pied={<Bouton className="w-full" onClick={() => onSave({ heure_passage: heure || null, table_ids: ids })}>Enregistrer</Bouton>}>
      <label className="block text-[13px] font-medium">Heure de passage
        <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={champ} />
      </label>
      <p className="mt-6 text-[13px] font-medium">Tables réservées</p>
      <p className={`text-[13px] ${places < classe.effectif ? "text-[#B30000]" : "text-[#717171]"}`}>
        {places} places pour {classe.effectif} élèves
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {tables.map((t) => {
          const actif = ids.includes(t.id);
          const autre = prisePar(t.id);
          return (
            <button key={t.id} type="button" aria-pressed={actif}
              onClick={() => setIds(actif ? ids.filter((x) => x !== t.id) : [...ids, t.id])}
              className={`flex h-14 flex-col items-center justify-center rounded-[14px] border text-[14px] font-medium transition-colors ${
                actif ? "border-[#FF5A5F] bg-[#FFF0ED] text-[#222222]" : "border-[#EBEBEB] bg-white text-[#222222] hover:border-[#222222]"
              }`}>
              {t.nom}
              <span className="text-[11px] font-normal text-[#717171]">{autre ? autre.nom : `${t.places.length} pl.`}</span>
            </button>
          );
        })}
      </div>
    </Panneau>
  );
}

export default function Salle() {
  const [tables, setTables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [edition, setEdition] = useState(null); // "table" | classe
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const charger = useCallback(() => Promise.all([getSalleAdmin().then(setTables), getClassesModeClasse().then(setClasses)]), []);
  useEffect(() => { charger(); }, [charger]);
  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); setEdition(null); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };
  const nomTable = (id) => tables.find((t) => t.id === id)?.nom;
  const total = tables.reduce((s, t) => s + t.places.length, 0);
  const pmr = tables.reduce((s, t) => s + t.places.filter((p) => p.pmr).length, 0);

  return (
    <EspaceLayout titre="Plan de salle" surTitre={`${tables.length} tables · ${total} places · ${pmr} PMR`} onglets={ONGLETS_ADMIN} large
      action={<BoutonAction icone={Plus} onClick={() => setEdition("table")}>Ajouter une table</BoutonAction>}>
      <Alerte ok={msg.ok}>{msg.texte}</Alerte>
      <p className="mt-6 flex items-center gap-2 text-[14px] text-[#717171]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF5A5F] text-white"><Accessibility size={13} /></span>
        Touchez une chaise pour la réserver aux personnes à mobilité réduite.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} className="relative rounded-[22px] border border-[#EBEBEB] p-2 sm:p-4">
            <button type="button" aria-label={`Supprimer ${t.nom}`}
              className="absolute right-1 top-1 z-[1] flex h-10 w-10 items-center justify-center rounded-full text-[#717171] transition-colors hover:bg-[#FFF0ED] hover:text-[#B30000]"
              onClick={() => faire(() => supprimerTable(t.id), "Table supprimée.")}>
              <Trash2 size={17} strokeWidth={1.75} />
            </button>
            <TableRonde table={t} onToggle={(p) => faire(() => majPlace(p.id, !p.pmr), "Place mise à jour.")} />
          </div>
        ))}
      </div>

      {classes.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[22px] font-semibold" style={titreStyle}>Classes en mode classe</h2>
          <p className="text-[14px] text-[#717171]">Heure de passage et tables réservées : la cuisine voit chaque élève à sa place.</p>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {classes.map((c) => (
              <li key={c.id} className="flex items-center gap-4 rounded-[22px] border border-[#EBEBEB] p-4">
                <p className="w-16 shrink-0 text-[20px] font-semibold" style={titreStyle}>{c.heure_passage ? c.heure_passage.slice(0, 5) : "Libre"}</p>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">{c.nom} <span className="font-normal text-[#717171]">· {c.effectif} élèves</span></p>
                  <p className="truncate text-[13px] text-[#717171]">{c.table_ids.length ? `Tables ${c.table_ids.map(nomTable).filter(Boolean).sort().join(", ")}` : "Aucune table réservée"}</p>
                </div>
                <BoutonAction variante="doux" icone={Pencil} label={`Modifier ${c.nom}`} onClick={() => setEdition(c)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {edition === "table" && (
        <FormTable onClose={() => setEdition(null)} onSave={(f) => faire(() => creerTable(f), "Table ajoutée.")} />
      )}
      {edition && edition !== "table" && (
        <FormClasse classe={edition} tables={tables} classes={classes} onClose={() => setEdition(null)}
          onSave={(body) => faire(() => placerClasse(edition.id, body), `${edition.nom} mise à jour.`)} />
      )}
    </EspaceLayout>
  );
}
