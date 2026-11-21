import { useCallback, useEffect, useState } from "react";
import { Plus, UtensilsCrossed } from "lucide-react";
import { creerPlat, erreurApi, getIngredients, getPlats } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte, Champ } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { fcfa } from "../../utils/format";
import { ONGLETS_CUISINE } from "./onglets";

const VIDE = { nom: "", prix: 1500, ingredient_ids: [], sans_allergene_de: "", photo: null };

export default function Plats() {
  const [plats, setPlats] = useState([]);
  const [ings, setIngs] = useState([]);
  const [f, setF] = useState(VIDE);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const [ouvert, setOuvert] = useState(false);

  const charger = useCallback(() => getPlats().then(setPlats), []);
  useEffect(() => { charger(); getIngredients().then(setIngs); }, [charger]);

  const choisis = ings.filter((i) => f.ingredient_ids.includes(i.id));
  const deduits = [...new Set(choisis.flatMap((i) => i.allergenes))].sort();

  const photo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, photo: r.result }));
    r.readAsDataURL(file);
  };

  const enregistrer = async () => {
    try {
      await creerPlat({ ...f, prix: Number(f.prix), sans_allergene_de: f.sans_allergene_de ? Number(f.sans_allergene_de) : null });
      setF(VIDE);
      setOuvert(false);
      await charger();
      setMsg({ texte: "Plat créé.", ok: true });
    } catch (e) {
      setMsg({ texte: erreurApi(e), ok: false });
    }
  };

  return (
    <EspaceLayout titre="Plats" onglets={ONGLETS_CUISINE} large
      action={<BoutonAction icone={Plus} onClick={() => setOuvert(true)}>Nouveau plat</BoutonAction>}>
      <Alerte ok={msg.ok}>{msg.texte}</Alerte>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plats.map((p) => (
          <Carte key={p.id} className="border-[#EBEBEB]">
            <div className="overflow-hidden rounded-[22px] bg-[#F7F7F7]" style={{ aspectRatio: "4/3" }}>
              {p.photo ? <img src={p.photo} alt="" className="h-full w-full object-cover" /> : (
                <div className="flex h-full items-center justify-center"><UtensilsCrossed size={40} strokeWidth={1.25} className="text-[#717171]" /></div>
              )}
            </div>
            <p className="mt-3 text-[16px] font-medium text-[#222222]">{p.nom}</p>
            <p className="text-[14px] text-[#717171]">{fcfa(p.prix)}</p>
            <p className="mt-1 text-[13px] text-[#717171]">{p.ingredients.join(", ")}</p>
            {p.allergenes.length > 0 ? (
              <p className="mt-1 text-[14px] text-[#B30000]">
                {p.allergenes.join(", ")} · {p.impact.eleves} élèves ({p.impact.pourcentage} %) ne peuvent pas manger ce plat
              </p>
            ) : <p className="mt-1 text-[14px] text-[#222222]">Aucun allergène</p>}
          </Carte>
        ))}
      </div>
      <Panneau ouvert={ouvert} onClose={() => setOuvert(false)} titre="Nouveau plat" surTitre="Ajouter" large
        pied={<Bouton className="w-full" disabled={!f.nom.trim() || !f.ingredient_ids.length} onClick={enregistrer}>Créer le plat</Bouton>}>
        <div className="grid gap-3">
          <Champ label="Nom" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
          <Champ label="Prix du plat entier (F)" type="number" value={f.prix} onChange={(e) => setF({ ...f, prix: e.target.value })} />
          <label className="block">
            <span className="text-[13px] text-[#717171]">Version sans allergène de</span>
            <select value={f.sans_allergene_de} onChange={(e) => setF({ ...f, sans_allergene_de: e.target.value })}
              className="mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-[15px]">
              <option value="">Aucune (plat principal)</option>
              {plats.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-4 text-[13px] text-[#717171]">Ingrédients</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ings.map((i) => {
            const actif = f.ingredient_ids.includes(i.id);
            return (
              <button key={i.id} type="button" aria-pressed={actif}
                onClick={() => setF({ ...f, ingredient_ids: actif ? f.ingredient_ids.filter((x) => x !== i.id) : [...f.ingredient_ids, i.id] })}
                className={`h-10 rounded-full border px-3 text-[14px] ${actif ? "border-[#222222] bg-[#FFF0ED] font-medium" : "border-[#EBEBEB]"}`}>
                {i.nom}{i.allergenes.length > 0 && <span className="ml-1 text-[#FF5A5F]">•</span>}
              </button>
            );
          })}
        </div>
        <p className={`mt-3 text-[14px] ${deduits.length ? "text-[#B30000]" : "text-[#717171]"}`}>
          Allergènes déduits : {deduits.length ? deduits.join(", ") : "aucun"}
        </p>
        <label className="mt-3 inline-flex min-h-12 cursor-pointer items-center gap-2 text-[14px] text-[#222222] underline">
          {f.photo ? "Changer la photo" : "Prendre / choisir la photo du plat"}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={photo} />
        </label>
        {f.photo && <img src={f.photo} alt="" className="mt-2 h-32 rounded-[22px] object-cover" style={{ aspectRatio: "4/3" }} />}
      </Panneau>
    </EspaceLayout>
  );
}
