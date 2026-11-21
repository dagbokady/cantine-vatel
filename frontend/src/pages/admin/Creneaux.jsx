import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { creerCreneau, erreurApi, getCreneauxAdmin, majCreneau, supprimerCreneau } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";
import ChampDate from "./ChampDate";

const champ = "h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-[15px] outline-none focus:border-[#222222]";
const hm = (t) => t.slice(0, 5);

export default function Creneaux() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [liste, setListe] = useState([]);
  const [f, setF] = useState({ heure_debut: "12:00", heure_fin: "12:20", capacite: 24 });
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const [edition, setEdition] = useState(null); // "nouveau" | créneau
  const [capacite, setCapacite] = useState(0);

  const charger = useCallback(() => getCreneauxAdmin(date).then(setListe), [date]);
  useEffect(() => { charger(); }, [charger]);
  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); setEdition(null); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Créneaux" surTitre="Horaires et capacités" onglets={ONGLETS_ADMIN} large
      action={
        <div className="flex flex-wrap items-center gap-2">
          <ChampDate value={date} onChange={setDate} />
          <BoutonAction icone={Plus} onClick={() => setEdition("nouveau")}>Nouveau créneau</BoutonAction>
        </div>
      }>
      <div className="mb-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      <div>
        <section>
          {liste.length === 0 && <p className="rounded-[22px] bg-[#F7F7F7] px-5 py-10 text-center text-[15px] text-[#717171]">Aucun créneau ce jour.</p>}
          <ul className="grid gap-3 lg:grid-cols-2">
            {liste.map((c) => {
              const pct = c.capacite ? Math.min(100, (100 * c.commandes) / c.capacite) : 0;
              return (
                <li key={c.id} className="rounded-[22px] border border-[#EBEBEB] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[24px] font-semibold leading-none" style={titreStyle}>{hm(c.heure_debut)} <span className="text-[#B0B0B0]">→</span> {hm(c.heure_fin)}</p>
                      <p className="mt-2 text-[14px] text-[#717171]">{c.commandes} commande{c.commandes > 1 ? "s" : ""} sur {c.capacite}</p>
                    </div>
                    <button type="button" aria-label="Supprimer le créneau"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#717171] transition-colors hover:bg-[#FFF0ED] hover:text-[#B30000]"
                      onClick={() => faire(() => supprimerCreneau(c.id), "Créneau supprimé.")}>
                      <Trash2 size={17} strokeWidth={1.75} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F7F7F7]">
                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-[#B30000]" : "bg-[#FF5A5F]"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <BoutonAction variante="doux" icone={Pencil} label={`Modifier la capacité du créneau ${hm(c.heure_debut)}`}
                      onClick={() => { setCapacite(c.capacite); setEdition(c); }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

      </div>

      <Panneau ouvert={edition === "nouveau"} onClose={() => setEdition(null)} titre="Nouveau créneau" surTitre="Ajouter"
        pied={<Bouton className="w-full" onClick={() => faire(() => creerCreneau({ date, ...f }), "Créneau ajouté.")}>Ajouter le créneau</Bouton>}>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[13px] font-medium">Début
            <input type="time" className={`${champ} mt-1.5`} value={f.heure_debut} onChange={(e) => setF({ ...f, heure_debut: e.target.value })} />
          </label>
          <label className="text-[13px] font-medium">Fin
            <input type="time" className={`${champ} mt-1.5`} value={f.heure_fin} onChange={(e) => setF({ ...f, heure_fin: e.target.value })} />
          </label>
          <label className="col-span-2 text-[13px] font-medium">Capacité (couverts)
            <input type="number" min={1} className={`${champ} mt-1.5`} value={f.capacite} onChange={(e) => setF({ ...f, capacite: Number(e.target.value) })} />
          </label>
        </div>
      </Panneau>

      <Panneau ouvert={!!edition && edition !== "nouveau"} onClose={() => setEdition(null)} surTitre="Modifier"
        titre={edition && edition !== "nouveau" ? `${hm(edition.heure_debut)} → ${hm(edition.heure_fin)}` : ""}
        pied={
          <Bouton className="w-full" disabled={capacite < 1}
            onClick={() => faire(() => majCreneau(edition.id, { date, heure_debut: hm(edition.heure_debut), heure_fin: hm(edition.heure_fin), capacite }), "Capacité mise à jour.")}>
            Enregistrer
          </Bouton>
        }>
        <label className="block text-[13px] font-medium">Capacité (couverts)
          <input type="number" min={1} className={`${champ} mt-1.5`} value={capacite} onChange={(e) => setCapacite(Number(e.target.value))} />
        </label>
        {edition && edition !== "nouveau" && <p className="mt-2 text-[13px] text-[#717171]">{edition.commandes} commandes déjà passées.</p>}
      </Panneau>
    </EspaceLayout>
  );
}
