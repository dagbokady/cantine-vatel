import { useEffect, useState } from "react";
import { ChefHat, Pencil, Plus } from "lucide-react";
import { creerChef, erreurApi, modifierChef, getCuisiniers, getNiveaux, getParametres, putNiveau, putParametres } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton, Carte } from "../../components/EspaceLayout";
import Panneau, { BoutonAction } from "../../components/Panneau";
import { fcfa, formatHeure } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";

const champ = "mt-1.5 h-12 w-full rounded-[12px] border border-[#EBEBEB] px-3 text-[15px] text-[#222222] outline-none focus:border-[#222222]";

function Bloc({ titre, description, children }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-[#EBEBEB] py-8 first:border-t-0 first:pt-0 md:grid-cols-[280px_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-[20px] font-semibold" style={titreStyle}>{titre}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#717171]">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

const MODE = { classe: "par classe", commande: "par commande" };

function FormCommandes({ p, onClose, onSave }) {
  const [f, setF] = useState(p);
  return (
    <Panneau ouvert onClose={onClose} titre="Fenêtre de commande" surTitre="Modifier"
      pied={<Bouton className="w-full" onClick={() => onSave(f)}>Enregistrer</Bouton>}>
      <div className="grid gap-4">
        <label className="text-[13px] font-medium">Ouverture (la veille)
          <input type="time" className={champ} value={f.ouverture_commandes.slice(0, 5)} onChange={(e) => setF({ ...f, ouverture_commandes: e.target.value })} />
        </label>
        <label className="text-[13px] font-medium">Clôture
          <input type="time" className={champ} value={f.cloture_commandes.slice(0, 5)} onChange={(e) => setF({ ...f, cloture_commandes: e.target.value })} />
          <span className="mt-1 block text-[12px] font-normal text-[#B0B0B0]">Les quantités de la cuisine sont figées à cette heure.</span>
        </label>
        <label className="text-[13px] font-medium">Récréation : choix de la vague
          <input type="time" className={champ} value={(f.heure_recreation ?? "10:00").slice(0, 5)} onChange={(e) => setF({ ...f, heure_recreation: e.target.value })} />
          <span className="mt-1 block text-[12px] font-normal text-[#B0B0B0]">Le jour même, les élèves choisissent leur vague à partir de cette heure.</span>
        </label>
        <label className="text-[13px] font-medium">Découvert autorisé (F)
          <input type="number" min={0} className={champ} value={f.decouvert_max} onChange={(e) => setF({ ...f, decouvert_max: Number(e.target.value) })} />
        </label>
      </div>
    </Panneau>
  );
}

// Création, modification, réaffectation et désactivation d'un chef. Jamais de suppression :
// ses retours et décisions passés restent attribués.
function FormChef({ c, niveaux, onClose, onSave }) {
  const nouveau = !c.id;
  const [f, setF] = useState({ nom: c.nom ?? "", identifiant: c.identifiant ?? "", mot_de_passe: "", actif: c.actif ?? true });
  const [ids, setIds] = useState((c.niveaux ?? []).map((n) => n.id));
  const modeChoisi = niveaux.find((n) => ids.includes(n.id))?.mode;
  const basculer = (id) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  const mdpOk = nouveau ? f.mot_de_passe.length >= 8 : !f.mot_de_passe || f.mot_de_passe.length >= 8;
  const valide = f.nom.trim().length >= 2 && f.identifiant.trim().length >= 3 && mdpOk;
  return (
    <Panneau ouvert onClose={onClose} titre={nouveau ? "Nouveau chef" : c.nom} surTitre={nouveau ? "Ajouter" : "Modifier"}
      pied={<Bouton className="w-full" disabled={!valide} onClick={() => onSave({ ...f, mot_de_passe: f.mot_de_passe || null, niveau_ids: ids })}>Enregistrer</Bouton>}>
      <div className="grid gap-4">
        <label className="text-[13px] font-medium">Nom
          <input className={champ} value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} autoComplete="off" />
        </label>
        <label className="text-[13px] font-medium">Identifiant de connexion
          <input type="email" className={champ} value={f.identifiant} placeholder="nom@ecole.ci" autoComplete="off"
            onChange={(e) => setF({ ...f, identifiant: e.target.value })} />
        </label>
        <label className="text-[13px] font-medium">{nouveau ? "Mot de passe provisoire" : "Nouveau mot de passe (facultatif)"}
          <input type="password" className={champ} value={f.mot_de_passe} autoComplete="new-password"
            onChange={(e) => setF({ ...f, mot_de_passe: e.target.value })} />
          <span className={`mt-1 block text-[12px] font-normal ${mdpOk ? "text-[#B0B0B0]" : "text-[#B30000]"}`}>8 caractères minimum.</span>
        </label>
        {!nouveau && (
          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[16px] border border-[#EBEBEB] px-4">
            <input type="checkbox" className="h-5 w-5 accent-[#FF5A5F]" checked={f.actif} onChange={(e) => setF({ ...f, actif: e.target.checked })} />
            <span className="flex-1 text-[15px] font-medium">Compte actif</span>
            <span className="text-[13px] text-[#717171]">{f.actif ? "Peut se connecter" : "Accès bloqué"}</span>
          </label>
        )}
      </div>
      <p className="mt-6 text-[13px] font-medium">Cuisine : niveaux servis</p>
      <p className="mt-1 text-[13px] text-[#717171]">Plusieurs chefs peuvent partager les mêmes niveaux. Un chef travaille dans un seul mode.</p>
      <ul className="mt-3 space-y-2">
        {niveaux.map((n) => {
          const coche = ids.includes(n.id);
          const bloque = !coche && modeChoisi && n.mode !== modeChoisi;
          return (
            <li key={n.id}>
              <label className={`flex min-h-14 items-center gap-3 rounded-[16px] border px-4 ${coche ? "border-[#222222]" : "border-[#EBEBEB]"} ${bloque ? "opacity-40" : "cursor-pointer"}`}>
                <input type="checkbox" className="h-5 w-5 accent-[#FF5A5F]" checked={coche} disabled={bloque} onChange={() => basculer(n.id)} />
                <span className="flex-1 text-[15px] font-medium">{n.nom}</span>
                <span className="text-[13px] text-[#717171]">{MODE[n.mode]}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </Panneau>
  );
}

export default function Parametres() {
  const [p, setP] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [cuisiniers, setCuisiniers] = useState([]);
  const [edition, setEdition] = useState(null); // "commandes" | cuisinier
  const [msg, setMsg] = useState({ texte: "", ok: true });
  useEffect(() => { getParametres().then(setP); getNiveaux().then(setNiveaux); getCuisiniers().then(setCuisiniers); }, []);
  const faire = async (fn, ok) => {
    try { await fn(); setMsg({ texte: ok, ok: true }); setEdition(null); } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  return (
    <EspaceLayout titre="Paramètres" surTitre="Règles de fonctionnement" onglets={ONGLETS_ADMIN} large>
      <div className="mb-6"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      {p && (
        <Bloc titre="Commandes" description="Fenêtre pendant laquelle les élèves réservent, et découvert toléré sur leur crédit.">
          <Carte className="flex flex-wrap items-center justify-between gap-4">
            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
              <div><dt className="text-[12px] text-[#717171]">Ouverture</dt><dd className="text-[18px] font-semibold" style={titreStyle}>{formatHeure(p.ouverture_commandes)}</dd></div>
              <div><dt className="text-[12px] text-[#717171]">Clôture</dt><dd className="text-[18px] font-semibold" style={titreStyle}>{formatHeure(p.cloture_commandes)}</dd></div>
              <div><dt className="text-[12px] text-[#717171]">Choix de vague</dt><dd className="text-[18px] font-semibold" style={titreStyle}>{formatHeure(p.heure_recreation ?? "10:00")}</dd></div>
              <div><dt className="text-[12px] text-[#717171]">Découvert</dt><dd className="text-[18px] font-semibold" style={titreStyle}>{fcfa(p.decouvert_max)}</dd></div>
            </dl>
            <BoutonAction variante="doux" icone={Pencil} onClick={() => setEdition("commandes")}>Modifier</BoutonAction>
          </Carte>
        </Bloc>
      )}
      <Bloc titre="Mode par niveau" description="Pour chaque niveau, repas gérés par classe ou par commande individuelle.">
        <ul className="divide-y divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB]">
          {niveaux.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
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
      <Bloc titre="Chefs de cuisine" description="Comptes et affectations des chefs. Les prix des portions et la composition des plats sont réglés par les chefs eux-mêmes.">
        <div className="mb-3 flex justify-end">
          <BoutonAction icone={Plus} onClick={() => setEdition({})}>Nouveau chef</BoutonAction>
        </div>
        <ul className="divide-y divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB]">
          {cuisiniers.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0ED] text-[#FF5A5F]"><ChefHat size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-[15px] font-medium">
                  {c.nom}
                  {!c.actif && <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[11px] font-medium text-[#717171]">Désactivé</span>}
                </p>
                <p className="truncate text-[13px] text-[#717171]">
                  {c.niveaux.length ? `${c.niveaux.map((n) => n.nom).join(", ")} · ${MODE[c.niveaux[0].mode]}` : "Non affecté : voit tous les niveaux"}
                </p>
              </div>
              <BoutonAction variante="doux" icone={Pencil} label={`Modifier ${c.nom}`} onClick={() => setEdition(c)}>
                <span className="hidden sm:inline">Modifier</span>
              </BoutonAction>
            </li>
          ))}
          {!cuisiniers.length && <li className="px-5 py-4 text-[14px] text-[#717171]">Aucun compte cuisine.</li>}
        </ul>
      </Bloc>
      {edition === "commandes" && (
        <FormCommandes p={p} onClose={() => setEdition(null)}
          onSave={(f) => faire(async () => { await putParametres(f); setP(f); }, "Paramètres enregistrés.")} />
      )}
      {edition && edition !== "commandes" && (
        <FormChef c={edition} niveaux={niveaux} onClose={() => setEdition(null)}
          onSave={(corps) => faire(async () => {
            if (edition.id) {
              const maj = await modifierChef(edition.id, corps);
              setCuisiniers(cuisiniers.map((x) => (x.id === maj.id ? maj : x)));
            } else {
              const cree = await creerChef(corps);
              setCuisiniers([...cuisiniers, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
            }
          }, edition.id ? "Chef mis à jour." : "Chef ajouté.")} />
      )}
    </EspaceLayout>
  );
}
