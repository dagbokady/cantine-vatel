import { useCallback, useEffect, useState } from "react";
import { creerIngredient, erreurApi, getAllergenesCuisine, getIngredients } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte, Champ } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { ONGLETS_CUISINE } from "./onglets";

export default function Ingredients() {
  const [ings, setIngs] = useState([]);
  const [algs, setAlgs] = useState([]);
  const [nom, setNom] = useState("");
  const [choix, setChoix] = useState([]);
  const [msg, setMsg] = useState({ texte: "", ok: true });

  const charger = useCallback(() => getIngredients().then(setIngs), []);
  useEffect(() => { charger(); getAllergenesCuisine().then(setAlgs); }, [charger]);

  const ajouter = async () => {
    try {
      await creerIngredient({ nom, allergenes: choix });
      setNom(""); setChoix([]);
      await charger();
      setMsg({ texte: "Ingrédient ajouté.", ok: true });
    } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Ingrédients et allergènes" onglets={ONGLETS_CUISINE} large>
      <Carte>
        <Libelle>Nouvel ingrédient</Libelle>
        <div className="mt-3 max-w-[400px]"><Champ label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex. poisson fumé" /></div>
        <p className="mt-3 text-[13px] text-[#93939f]">Allergènes contenus</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {algs.map((a) => {
            const actif = choix.includes(a);
            return (
              <button key={a} type="button" aria-pressed={actif} onClick={() => setChoix(actif ? choix.filter((x) => x !== a) : [...choix, a])}
                className={`h-10 rounded-full border px-3 text-[14px] ${actif ? "border-[#ff7759] bg-[#eeece7] font-medium" : "border-[#d9d9dd]"}`}>{a}</button>
            );
          })}
        </div>
        <Bouton variante="vert" className="mt-3" disabled={nom.trim().length < 2} onClick={ajouter}>Ajouter</Bouton>
      </Carte>
      <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      <ul className="mt-6 divide-y divide-[#f2f2f2]">
        {ings.map((i) => (
          <li key={i.id} className="flex items-center justify-between py-3 text-[15px]">
            <span className="text-[#212121]">{i.nom}</span>
            <span className={i.allergenes.length ? "text-[#b30000]" : "text-[#93939f]"}>{i.allergenes.join(", ") || "—"}</span>
          </li>
        ))}
      </ul>
    </EspaceLayout>
  );
}
