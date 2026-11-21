import { useEffect, useState } from "react";
import { erreurApi, getNiveaux, getParametres, putNiveau, putParametres } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";

const champ = "mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] px-3 text-[15px] text-[#222222] outline-none focus:border-[#222222]";

function Bloc({ titre, description, children }) {
  return (
    <section className="grid gap-4 border-t border-[#EBEBEB] py-8 first:border-t-0 first:pt-0 md:grid-cols-[280px_1fr] md:gap-10">
      <div>
        <h2 className="text-[20px] font-semibold" style={titreStyle}>{titre}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#717171]">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function Parametres() {
  const [p, setP] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  useEffect(() => { getParametres().then(setP); getNiveaux().then(setNiveaux); }, []);
  const faire = async (fn, ok) => {
    try { await fn(); setMsg({ texte: ok, ok: true }); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Paramètres" surTitre="Règles de fonctionnement" onglets={ONGLETS_ADMIN} large>
      <div className="mb-6"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      {p && (
        <Bloc titre="Commandes" description="Fenêtre pendant laquelle les élèves réservent, et découvert toléré sur leur crédit.">
          <Carte>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-[13px] font-medium">Ouverture (la veille)
                <input type="time" className={champ} value={p.ouverture_commandes.slice(0, 5)} onChange={(e) => setP({ ...p, ouverture_commandes: e.target.value })} />
              </label>
              <label className="text-[13px] font-medium">Clôture
                <input type="time" className={champ} value={p.cloture_commandes.slice(0, 5)} onChange={(e) => setP({ ...p, cloture_commandes: e.target.value })} />
                <span className="mt-1 block text-[12px] font-normal text-[#B0B0B0]">Fiche cuisine figée</span>
              </label>
              <label className="text-[13px] font-medium">Découvert autorisé (F)
                <input type="number" min={0} className={champ} value={p.decouvert_max} onChange={(e) => setP({ ...p, decouvert_max: Number(e.target.value) })} />
              </label>
            </div>
            <Bouton className="mt-5" onClick={() => faire(() => putParametres(p), "Paramètres enregistrés.")}>Enregistrer</Bouton>
          </Carte>
        </Bloc>
      )}
      <Bloc titre="Mode par niveau" description="Pour chaque niveau, repas gérés par classe ou par commande individuelle.">
        <ul className="divide-y divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB]">
          {niveaux.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span className="text-[16px] font-medium">{n.nom}</span>
              <div className="flex rounded-full bg-[#F7F7F7] p-1">
                {["classe", "commande"].map((m) => (
                  <button key={m} type="button" aria-pressed={n.mode === m}
                    onClick={() => faire(async () => { await putNiveau(n.id, m); setNiveaux(niveaux.map((x) => (x.id === n.id ? { ...x, mode: m } : x))); }, `${n.nom} : mode ${m}.`)}
                    className={`h-9 rounded-full px-4 text-[14px] transition-colors ${n.mode === m ? "bg-white font-medium text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-[#717171]"}`}>
                    {m === "classe" ? "Classe" : "Commande"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Bloc>
    </EspaceLayout>
  );
}
