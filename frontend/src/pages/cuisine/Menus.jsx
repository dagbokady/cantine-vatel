import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Tag } from "lucide-react";
import { erreurApi, getMenusCuisine, getPlats, majMenu, majPrixMenu, publierMenu, supprimerMenu } from "../../api/pro";
import { useAuth } from "../../hooks/useAuth";
import { PanneauPrix } from "./PlatEdition";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { Libelle } from "../../components/ui";
import { fcfa } from "../../utils/format";
import { ONGLETS_CUISINE } from "./onglets";
import NotificationsCommandes from "./Notifications";

// L'accompagnement seul ne se commande pas : il sert au mode classe ; en mode commande il se configure dans la composition du plat.
const TYPES = { principal: "Plat principal", sans_allergene: "Sans allergène", accompagnement: "Accompagnement (mode classe)" };
const champ = "mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-[16px] outline-none focus:border-[#222222]";
const VIDE = () => ({ date: new Date().toLocaleDateString("sv-SE"), plat_id: "", type: "principal", portions: 60 });

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [plats, setPlats] = useState([]);
  const [f, setF] = useState(VIDE);
  const [edition, setEdition] = useState(null); // "nouveau" | menu
  const [portions, setPortions] = useState(0);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const [prixMenu, setPrixMenu] = useState(null);
  const { user } = useAuth();

  const charger = useCallback(() => getMenusCuisine().then(setMenus), []);
  useEffect(() => { charger(); getPlats().then(setPlats); }, [charger]);

  const faire = async (fn, ok) => {
    try { await fn(); await charger(); setMsg({ texte: ok, ok: true }); setEdition(null); }
    catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  const parJour = menus.reduce((acc, m) => ((acc[m.date] ||= []).push(m), acc), {});
  const plat = plats.find((p) => String(p.id) === String(f.plat_id));

  return (
    <EspaceLayout titre="Menus de la semaine" onglets={ONGLETS_CUISINE} outils={<NotificationsCommandes />} large
      action={<BoutonAction icone={Plus} onClick={() => { setF(VIDE()); setEdition("nouveau"); }}>Publier un plat</BoutonAction>}>
      <Alerte ok={msg.ok}>{msg.texte}</Alerte>

      {Object.entries(parJour).map(([date, liste]) => (
        <section key={date} className="mt-6">
          <Libelle>{new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Libelle>
          <ul className="mt-2 divide-y divide-[#EBEBEB]">
            {liste.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#222222]">{m.plat_nom}</p>
                  <p className="text-[13px] text-[#717171]">{TYPES[m.type]} · {["1", "2", "3"].map((t) => `${t}/3 ${fcfa(m.prix_portions?.[t] ?? m.prix)}`).join(" · ")} · reste {m.portions_restantes} / {m.portions_prevues} portions</p>
                </div>
                {user?.role === "cuisine" && (
                  <BoutonAction variante="doux" icone={Tag} label={`Prix de ${m.plat_nom}`} onClick={() => setPrixMenu(m)} />
                )}
                <BoutonAction variante="doux" icone={Pencil} label={`Modifier ${m.plat_nom}`} onClick={() => { setPortions(m.portions_prevues); setEdition(m); }} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Panneau ouvert={edition === "nouveau"} onClose={() => setEdition(null)} titre="Publier un plat" surTitre="Menu"
        pied={
          <Bouton className="w-full" disabled={!f.plat_id || f.portions < 1}
            onClick={() => faire(() => publierMenu({ ...f, plat_id: Number(f.plat_id) }), "Menu publié.")}>Publier</Bouton>
        }>
        <div className="grid gap-4">
          <label className="text-[13px] font-medium">Date
            <input type="date" className={champ} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </label>
          <label className="text-[13px] font-medium">Plat
            <select className={champ} value={f.plat_id} onChange={(e) => setF({ ...f, plat_id: e.target.value })}>
              <option value="">Choisir un plat…</option>
              {plats.map((p) => <option key={p.id} value={p.id}>{p.nom} · {fcfa(p.prix)}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-medium">Type
              <select className={champ} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
                {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="text-[13px] font-medium">Portions prévues
              <input type="number" min={1} className={champ} value={f.portions} onChange={(e) => setF({ ...f, portions: Number(e.target.value) })} />
            </label>
          </div>
          {plat && plat.allergenes.length > 0 && (
            <p className="rounded-[14px] bg-[#FFF0ED] px-4 py-3 text-[14px] text-[#B30000]">
              Allergènes : {plat.allergenes.join(", ")}. {plat.impact.eleves} élèves ({plat.impact.pourcentage} %) ne peuvent pas manger ce plat : prévoyez la version sans allergène.
            </p>
          )}
        </div>
      </Panneau>

      <Panneau ouvert={!!edition && edition !== "nouveau"} onClose={() => setEdition(null)} titre={edition?.plat_nom ?? ""} surTitre="Modifier le stock"
        pied={
          <div className="flex gap-2">
            <Bouton variante="danger" className="flex-1" onClick={() => faire(() => supprimerMenu(edition.id), "Menu retiré.")}>Retirer</Bouton>
            <Bouton className="flex-[1.4]" disabled={portions < 0} onClick={() => faire(() => majMenu(edition.id, portions), "Stock mis à jour.")}>Enregistrer</Bouton>
          </div>
        }>
        {edition && edition !== "nouveau" && (
          <>
            <p className="text-[14px] text-[#717171]">{TYPES[edition.type]} · reste {edition.portions_restantes} portions</p>
            <label className="mt-4 block text-[13px] font-medium">Portions prévues
              <input type="number" min={0} className={champ} value={portions} onChange={(e) => setPortions(Number(e.target.value))} />
            </label>
          </>
        )}
      </Panneau>
      <PanneauPrix plat={prixMenu} titre="Prix de ce menu" enregistrer={majPrixMenu} onClose={() => setPrixMenu(null)}
        onSaved={async (_, texte) => { setPrixMenu(null); await charger(); setMsg({ texte, ok: true }); }} />
    </EspaceLayout>
  );
}
