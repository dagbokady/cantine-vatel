import { useCallback, useEffect, useState } from "react";
import { creerIngredient, erreurApi, getAllergenesCuisine, getIngredients } from "../../api/pro";
import { Plus } from "lucide-react";
import EspaceLayout, { Alerte, Bouton, Champ } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { ONGLETS_CUISINE } from "./onglets";

export default function Ingredients() {
  const [ings, setIngs] = useState([]);
  const [algs, setAlgs] = useState([]);
  const [nom, setNom] = useState("");
  const [choix, setChoix] = useState([]);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  const [ouvert, setOuvert] = useState(false);

  const charger = useCallback(() => getIngredients().then(setIngs), []);
  useEffect(() => { charger(); getAllergenesCuisine().then(setAlgs); }, [charger]);

  const ajouter = async () => {
    try {
      await creerIngredient({ nom, allergenes: choix });
      setNom(""); setChoix([]); setOuvert(false);
      await charger();
      setMsg({ texte: "Ingrédient ajouté.", ok: true });
    } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Ingrédients et allergènes" onglets={ONGLETS_CUISINE} large
      action={<BoutonAction icone={Plus} onClick={() => setOuvert(true)}>Ajouter</BoutonAction>}>
      <Alerte ok={msg.ok}>{msg.texte}</Alerte>
      <ul className="mt-6 divide-y divide-[#EBEBEB]">
        {ings.map((i) => (
          <li key={i.id} className="flex items-center justify-between py-3 text-[15px]">
            <span className="text-[#222222]">{i.nom}</span>
            <span className={i.allergenes.length ? "text-[#B30000]" : "text-[#717171]"}>{i.allergenes.join(", ") || "Aucun allergène"}</span>
          </li>
        ))}
      </ul>
      <Panneau ouvert={ouvert} onClose={() => setOuvert(false)} titre="Nouvel ingrédient" surTitre="Ajouter"
        pied={<Bouton className="w-full" disabled={nom.trim().length < 2} onClick={ajouter}>Ajouter l'ingrédient</Bouton>}>
        <div><Champ label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. poisson fumé" /></div>
        <p className="mt-3 text-[13px] text-[#717171]">Allergènes contenus</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {algs.map((a) => {
            const actif = choix.includes(a);
            return (
              <button key={a} type="button" aria-pressed={actif} onClick={() => setChoix(actif ? choix.filter((x) => x !== a) : [...choix, a])}
                className={`h-10 rounded-full border px-3 text-[14px] ${actif ? "border-[#FF5A5F] bg-[#F7F7F7] font-medium" : "border-[#EBEBEB]"}`}>{a}</button>
            );
          })}
        </div>
      </Panneau>
    </EspaceLayout>
  );
}
