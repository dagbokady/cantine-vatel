import { useCallback, useEffect, useState } from "react";
import { erreurApi, getMenusCuisine, getPlats, majMenu, publierMenu, supprimerMenu } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { fcfa } from "../../utils/format";
import { ONGLETS_CUISINE } from "./onglets";

const TYPES = { principal: "Plat principal", sans_allergene: "Sans allergène", accompagnement: "Accompagnement" };
const champ = "h-12 rounded-[12px] border border-[#d9d9dd] bg-white px-3 text-[15px]";

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [plats, setPlats] = useState([]);
  const [f, setF] = useState({ date: new Date().toISOString().slice(0, 10), plat_id: "", type: "principal", portions: 60 });
  const [msg, setMsg] = useState({ texte: "", ok: true });

  const charger = useCallback(() => getMenusCuisine().then(setMenus), []);
  useEffect(() => { charger(); getPlats().then(setPlats); }, [charger]);

  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); }
    catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  const parJour = menus.reduce((acc, m) => ((acc[m.date] ||= []).push(m), acc), {});
  const plat = plats.find((p) => String(p.id) === String(f.plat_id));

  return (
    <EspaceLayout titre="Menus de la semaine" onglets={ONGLETS_CUISINE} large>
      <Carte>
        <Libelle>Publier un plat</Libelle>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <input type="date" className={champ} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date" />
          <select className={`${champ} md:col-span-2`} value={f.plat_id} onChange={(e) => setF({ ...f, plat_id: e.target.value })} aria-label="Plat">
            <option value="">Choisir un plat…</option>
            {plats.map((p) => <option key={p.id} value={p.id}>{p.nom} · {fcfa(p.prix)}</option>)}
          </select>
          <select className={champ} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Type">
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="number" min={1} className={champ} value={f.portions} onChange={(e) => setF({ ...f, portions: Number(e.target.value) })} aria-label="Portions prévues" />
        </div>
        {plat && plat.allergenes.length > 0 && (
          <p className="mt-2 text-[14px] text-[#b30000]">
            Allergènes : {plat.allergenes.join(", ")} · {plat.impact.eleves} élèves ({plat.impact.pourcentage} %) ne peuvent pas manger ce plat : prévois la version sans allergène.
          </p>
        )}
        <Bouton variante="vert" className="mt-3" disabled={!f.plat_id || f.portions < 1}
          onClick={() => faire(() => publierMenu({ ...f, plat_id: Number(f.plat_id) }), "Menu publié.")}>
          Publier
        </Bouton>
      </Carte>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>

      {Object.entries(parJour).map(([date, liste]) => (
        <section key={date} className="mt-6">
          <Libelle>{new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Libelle>
          <ul className="mt-2 divide-y divide-[#f2f2f2]">
            {liste.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#212121]">{m.plat_nom}</p>
                  <p className="text-[13px] text-[#616161]">{TYPES[m.type]} · {fcfa(m.prix)} · reste {m.portions_restantes} / {m.portions_prevues} portions</p>
                </div>
                <input type="number" min={0} defaultValue={m.portions_prevues} aria-label="Portions prévues"
                  onBlur={(e) => Number(e.target.value) !== m.portions_prevues && faire(() => majMenu(m.id, Number(e.target.value)), "Stock mis à jour.")}
                  className="h-12 w-24 rounded-[12px] border border-[#d9d9dd] px-3 text-[15px]" />
                <button type="button" className="min-h-12 px-2 text-[14px] text-[#b30000] underline" onClick={() => faire(() => supprimerMenu(m.id), "Menu retiré.")}>Retirer</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </EspaceLayout>
  );
}
