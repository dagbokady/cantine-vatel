import { useCallback, useEffect, useState } from "react";
import { creerCreneau, erreurApi, getCreneauxAdmin, majCreneau, supprimerCreneau } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { ONGLETS_ADMIN } from "./onglets";

const champ = "h-12 rounded-[12px] border border-[#d9d9dd] bg-white px-3 text-[15px]";
const hm = (t) => t.slice(0, 5);

export default function Creneaux() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [liste, setListe] = useState([]);
  const [f, setF] = useState({ heure_debut: "12:00", heure_fin: "12:20", capacite: 24 });
  const [msg, setMsg] = useState({ texte: "", ok: true });

  const charger = useCallback(() => getCreneauxAdmin(date).then(setListe), [date]);
  useEffect(() => { charger(); }, [charger]);
  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Créneaux et capacités" onglets={ONGLETS_ADMIN} large>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={champ} aria-label="Date" />
      <Carte className="mt-4">
        <Libelle>Nouveau créneau</Libelle>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <input type="time" className={champ} value={f.heure_debut} onChange={(e) => setF({ ...f, heure_debut: e.target.value })} aria-label="Début" />
          <input type="time" className={champ} value={f.heure_fin} onChange={(e) => setF({ ...f, heure_fin: e.target.value })} aria-label="Fin" />
          <input type="number" min={1} className={`${champ} w-28`} value={f.capacite} onChange={(e) => setF({ ...f, capacite: Number(e.target.value) })} aria-label="Capacité" />
          <Bouton variante="vert" onClick={() => faire(() => creerCreneau({ date, ...f }), "Créneau ajouté.")}>Ajouter</Bouton>
        </div>
      </Carte>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      <ul className="mt-4 divide-y divide-[#f2f2f2]">
        {liste.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="flex-1 text-[16px] font-medium">{hm(c.heure_debut)} – {hm(c.heure_fin)}</span>
            <span className="text-[14px] text-[#616161]">{c.commandes} commandes · capacité</span>
            <input type="number" min={1} defaultValue={c.capacite} aria-label="Capacité" className={`${champ} w-24`}
              onBlur={(e) => Number(e.target.value) !== c.capacite && faire(() => majCreneau(c.id, { date, heure_debut: hm(c.heure_debut), heure_fin: hm(c.heure_fin), capacite: Number(e.target.value) }), "Capacité mise à jour.")} />
            <button type="button" className="min-h-12 px-2 text-[14px] text-[#b30000] underline" onClick={() => faire(() => supprimerCreneau(c.id), "Créneau supprimé.")}>Supprimer</button>
          </li>
        ))}
      </ul>
    </EspaceLayout>
  );
}
