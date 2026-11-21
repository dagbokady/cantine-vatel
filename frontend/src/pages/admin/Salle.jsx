import { useCallback, useEffect, useState } from "react";
import { creerTable, erreurApi, getSalleAdmin, majPlace, supprimerTable } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { ONGLETS_ADMIN } from "./onglets";

export default function Salle() {
  const [tables, setTables] = useState([]);
  const [f, setF] = useState({ nom: "", nb_places: 6 });
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const charger = useCallback(() => getSalleAdmin().then(setTables), []);
  useEffect(() => { charger(); }, [charger]);
  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Plan de salle" onglets={ONGLETS_ADMIN} large>
      <Carte>
        <Libelle>Nouvelle table</Libelle>
        <div className="mt-3 flex flex-wrap gap-3">
          <input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="T9" aria-label="Nom"
            className="h-12 w-28 rounded-[12px] border border-[#d9d9dd] px-3 text-[15px]" />
          <input type="number" min={1} max={12} value={f.nb_places} onChange={(e) => setF({ ...f, nb_places: Number(e.target.value) })} aria-label="Places"
            className="h-12 w-24 rounded-[12px] border border-[#d9d9dd] px-3 text-[15px]" />
          <Bouton variante="vert" disabled={!f.nom.trim()} onClick={() => faire(() => creerTable(f), "Table ajoutée.")}>Ajouter</Bouton>
        </div>
      </Carte>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      <p className="mt-4 text-[14px] text-[#616161]">Touchez une place pour la réserver aux personnes à mobilité réduite (PMR).</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {tables.map((t) => (
          <Carte key={t.id} className="border-[#f2f2f2]">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-medium">{t.nom}</p>
              <button type="button" className="min-h-12 text-[13px] text-[#b30000] underline" onClick={() => faire(() => supprimerTable(t.id), "Table supprimée.")}>Supprimer</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.places.map((p) => (
                <button key={p.id} type="button" aria-pressed={p.pmr} onClick={() => faire(() => majPlace(p.id, !p.pmr), "Place mise à jour.")}
                  className={`h-12 w-12 rounded-full text-[14px] ${p.pmr ? "bg-[#003c33] text-white" : "border border-[#d9d9dd]"}`}
                  title={p.pmr ? "Place PMR" : "Place standard"}>
                  {p.pmr ? "♿" : p.numero}
                </button>
              ))}
            </div>
          </Carte>
        ))}
      </div>
    </EspaceLayout>
  );
}
