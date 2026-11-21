import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { erreurApi, majElementsPlat, majPrixPlat } from "../../api/pro";
import { Alerte, Bouton } from "../../components/EspaceLayout";
import Panneau from "../../components/Panneau";
import { fcfa, prixPortion } from "../../utils/format";

const champ = "mt-1 h-11 w-full rounded-[12px] border border-[#EBEBEB] bg-white px-3 text-[16px] outline-none focus:border-[#222222]";

function Bascule({ label, actif, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={`min-h-10 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-40 ${
        actif ? "border-[#222222] bg-[#FFF0ED] text-[#222222]" : "border-[#EBEBEB] text-[#717171]"
      }`}
    >
      {label}
    </button>
  );
}

let compteur = 0;
const nouvelElement = () => ({ cle: `n${++compteur}`, nom: "", ingredient_id: "", obligatoire: false, inclus_defaut: true, supplement: 0, stock_restant: "" });

// Composition d'un plat : éléments obligatoires ou facultatifs, suppléments et stock, configurés par la cuisine.
// Remonté à chaque plat (clé) : le formulaire part toujours des valeurs enregistrées.
export function PanneauComposition(props) {
  return props.plat ? <Composition key={props.plat.id} {...props} /> : null;
}

function Composition({ plat, ingredients, onClose, onSaved }) {
  const [liste, setListe] = useState(() => plat.elements.map((e) => ({ ...e, cle: String(e.id), stock_restant: e.stock_restant ?? "" })));
  const [msg, setMsg] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const maj = (cle, champs) => setListe((l) => l.map((e) => (e.cle === cle ? { ...e, ...champs } : e)));
  const valide = liste.every((e) => e.nom.trim().length >= 2 && e.ingredient_id);

  const enregistrer = async () => {
    setEnvoi(true);
    try {
      const corps = liste.map((e) => ({
        id: e.id ?? null,
        nom: e.nom.trim(),
        ingredient_id: Number(e.ingredient_id),
        obligatoire: e.obligatoire,
        inclus_defaut: e.inclus_defaut,
        supplement: Number(e.supplement) || 0,
        stock_restant: e.stock_restant === "" ? null : Number(e.stock_restant),
      }));
      onSaved(await majElementsPlat(plat.id, corps), "Composition enregistrée.");
    } catch (e) {
      setMsg(erreurApi(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Panneau
      ouvert={!!plat}
      onClose={onClose}
      titre={plat?.nom ?? ""}
      surTitre="Composition"
      large
      pied={
        <Bouton className="w-full" disabled={!valide || envoi} onClick={enregistrer}>
          {envoi ? "Enregistrement…" : "Enregistrer la composition"}
        </Bouton>
      }
    >
      <p className="text-[14px] leading-6 text-[#717171]">
        Base toujours servie : {plat?.ingredients.join(", ")}. Un élément obligatoire est toujours servi ; un élément
        facultatif peut être ajouté ou retiré par l'élève. Les allergènes viennent de l'ingrédient choisi.
      </p>
      <div className="mt-4"><Alerte>{msg}</Alerte></div>
      <ul className="mt-4 space-y-3">
        {liste.map((e) => {
          const ing = ingredients.find((i) => String(i.id) === String(e.ingredient_id));
          return (
            <li key={e.cle} className="rounded-[22px] border border-[#EBEBEB] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[13px] font-medium">
                  Nom affiché
                  <input className={champ} value={e.nom} placeholder="Ex : Alloco" onChange={(x) => maj(e.cle, { nom: x.target.value })} />
                </label>
                <label className="text-[13px] font-medium">
                  Ingrédient
                  <select className={champ} value={e.ingredient_id} onChange={(x) => maj(e.cle, { ingredient_id: x.target.value })}>
                    <option value="">Choisir…</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>{i.nom}{i.allergenes.length ? ` (${i.allergenes.join(", ")})` : ""}</option>
                    ))}
                  </select>
                </label>
              </div>
              {ing?.allergenes.length > 0 && <p className="mt-2 text-[13px] text-[#B30000]">Allergènes : {ing.allergenes.join(", ")}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Bascule label="Obligatoire" actif={e.obligatoire} onChange={(v) => maj(e.cle, { obligatoire: v })} />
                <Bascule label="Inclus par défaut" actif={e.obligatoire || e.inclus_defaut} disabled={e.obligatoire} onChange={(v) => maj(e.cle, { inclus_defaut: v })} />
                <button
                  type="button"
                  onClick={() => setListe((l) => l.filter((x) => x.cle !== e.cle))}
                  aria-label={`Retirer ${e.nom || "l'élément"}`}
                  className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-[#B30000] hover:bg-[#FFF0ED]"
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-[13px] font-medium">
                  Supplément (F)
                  <input type="number" min={0} step={25} inputMode="numeric" className={champ} disabled={e.obligatoire}
                    value={e.obligatoire ? 0 : e.supplement} onChange={(x) => maj(e.cle, { supplement: x.target.value })} />
                </label>
                <label className="text-[13px] font-medium">
                  Stock (vide = non suivi)
                  <input type="number" min={0} inputMode="numeric" className={champ} value={e.stock_restant}
                    onChange={(x) => maj(e.cle, { stock_restant: x.target.value })} />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => setListe((l) => [...l, nouvelElement()])}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#B0B0B0] text-[14px] font-medium text-[#222222] hover:border-[#222222]"
      >
        <Plus size={17} /> Ajouter un élément
      </button>
    </Panneau>
  );
}

// Prix des portions d'un plat : responsabilité des chefs de cuisine.
export function PanneauPrix(props) {
  return props.plat ? <Prix key={props.plat.id} {...props} /> : null;
}

function Prix({ plat, onClose, onSaved, titre = "Prix des portions", enregistrer = majPrixPlat }) {
  const [f, setF] = useState(() => ({ prix: plat.prix, prix_tiers1: plat.prix_tiers1 ?? "", prix_tiers2: plat.prix_tiers2 ?? "" }));
  const [msg, setMsg] = useState("");

  const n = (v) => (v === "" ? null : Number(v));
  const p3 = Number(f.prix) || 0;
  const p1 = n(f.prix_tiers1) ?? prixPortion(p3, 1);
  const p2 = n(f.prix_tiers2) ?? prixPortion(p3, 2);
  const coherent = p3 > 0 && p1 <= p2 && p2 <= p3;

  const valider = async () => {
    try {
      onSaved(await enregistrer(plat.id, { prix: p3, prix_tiers1: n(f.prix_tiers1), prix_tiers2: n(f.prix_tiers2) }), "Prix enregistrés.");
    } catch (e) {
      setMsg(erreurApi(e));
    }
  };

  const ligne = (cle, label, auto) => (
    <label className="flex items-center gap-4 border-b border-[#EBEBEB] py-3">
      <span className="w-16 text-[22px] font-semibold text-[#222222]">{label}</span>
      <input type="number" min={0} step={25} inputMode="numeric" className={`${champ} mt-0 flex-1`}
        value={f[cle]} placeholder={auto != null ? `${auto} (proportionnel)` : ""} onChange={(x) => setF({ ...f, [cle]: x.target.value })} />
      <span className="text-[14px] text-[#717171]">F</span>
    </label>
  );

  return (
    <Panneau ouvert={!!plat} onClose={onClose} titre={plat?.nom ?? plat?.plat_nom ?? ""} surTitre={titre}
      pied={<Bouton className="w-full" disabled={!coherent} onClick={valider}>Enregistrer les prix</Bouton>}>
      <p className="text-[14px] leading-6 text-[#717171]">
        Laissez 1/3 ou 2/3 vide pour un prix proportionnel. Les commandes déjà confirmées gardent leur prix.
      </p>
      <div className="mt-4"><Alerte>{msg}</Alerte></div>
      <div className="mt-2">
        {ligne("prix_tiers1", "1/3", prixPortion(p3, 1))}
        {ligne("prix_tiers2", "2/3", prixPortion(p3, 2))}
        {ligne("prix", "3/3")}
      </div>
      <p className={`mt-4 text-[14px] ${coherent ? "text-[#717171]" : "text-[#B30000]"}`}>
        {coherent ? `Élèves : ${fcfa(p1)} · ${fcfa(p2)} · ${fcfa(p3)}` : "Les prix doivent croître avec la portion."}
      </p>
    </Panneau>
  );
}
