import { useCallback, useEffect, useState } from "react";
import { Accessibility, Trash2 } from "lucide-react";
import { creerTable, erreurApi, getSalleAdmin, majPlace, supprimerTable } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
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

export default function Salle() {
  const [tables, setTables] = useState([]);
  const [f, setF] = useState({ nom: "", nb_places: 6 });
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const charger = useCallback(() => getSalleAdmin().then(setTables), []);
  useEffect(() => { charger(); }, [charger]);
  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };
  const total = tables.reduce((s, t) => s + t.places.length, 0);
  const pmr = tables.reduce((s, t) => s + t.places.filter((p) => p.pmr).length, 0);

  return (
    <EspaceLayout titre="Plan de salle" surTitre={`${tables.length} tables · ${total} places · ${pmr} PMR`} onglets={ONGLETS_ADMIN} large>
      <Carte className="border-transparent bg-[#F7F7F7]">
        <Libelle>Nouvelle table</Libelle>
        <div className="mt-3 flex items-end gap-3">
          <label className="min-w-0 flex-1 text-[13px] font-medium sm:w-28 sm:flex-none">Nom
            <input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="T9" className={champ} />
          </label>
          <label className="w-24 text-[13px] font-medium">Places
            <input type="number" min={1} max={12} value={f.nb_places} onChange={(e) => setF({ ...f, nb_places: Number(e.target.value) })} className={champ} />
          </label>
          <Bouton disabled={!f.nom.trim()} onClick={() => faire(() => creerTable(f), "Table ajoutée.")}>Ajouter</Bouton>
        </div>
      </Carte>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
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
    </EspaceLayout>
  );
}
