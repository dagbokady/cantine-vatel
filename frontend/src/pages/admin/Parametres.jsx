import { useEffect, useState } from "react";
import { erreurApi, getNiveaux, getParametres, putNiveau, putParametres } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { ONGLETS_ADMIN } from "./onglets";

const champ = "mt-1.5 h-12 w-full rounded-[12px] border border-[#d9d9dd] px-3 text-[15px]";

export default function Parametres() {
  const [p, setP] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  useEffect(() => { getParametres().then(setP); getNiveaux().then(setNiveaux); }, []);
  const faire = async (fn, ok) => {
    try { await fn(); setMsg({ texte: ok, ok: true }); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Paramètres" onglets={ONGLETS_ADMIN} large>
      {p && (
        <Carte>
          <Libelle>Fenêtre de commande et découvert</Libelle>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="text-[13px] text-[#93939f]">Ouverture (la veille)
              <input type="time" className={champ} value={p.ouverture_commandes.slice(0, 5)} onChange={(e) => setP({ ...p, ouverture_commandes: e.target.value })} />
            </label>
            <label className="text-[13px] text-[#93939f]">Clôture (fiche cuisine figée)
              <input type="time" className={champ} value={p.cloture_commandes.slice(0, 5)} onChange={(e) => setP({ ...p, cloture_commandes: e.target.value })} />
            </label>
            <label className="text-[13px] text-[#93939f]">Découvert autorisé (F)
              <input type="number" min={0} className={champ} value={p.decouvert_max} onChange={(e) => setP({ ...p, decouvert_max: Number(e.target.value) })} />
            </label>
          </div>
          <Bouton variante="vert" className="mt-3" onClick={() => faire(() => putParametres(p), "Paramètres enregistrés.")}>Enregistrer</Bouton>
        </Carte>
      )}
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      <Carte className="mt-4">
        <Libelle>Mode par niveau</Libelle>
        {niveaux.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-3 py-2">
            <span className="text-[16px]">{n.nom}</span>
            <div className="flex gap-2">
              {["classe", "commande"].map((m) => (
                <button key={m} type="button" aria-pressed={n.mode === m}
                  onClick={() => faire(async () => { await putNiveau(n.id, m); setNiveaux(niveaux.map((x) => (x.id === n.id ? { ...x, mode: m } : x))); }, `${n.nom} : mode ${m}.`)}
                  className={`h-10 rounded-full px-4 text-[14px] ${n.mode === m ? "bg-[#17171c] font-medium text-white" : "bg-[#eeece7]"}`}>
                  {m === "classe" ? "Classe" : "Commande"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Carte>
    </EspaceLayout>
  );
}
