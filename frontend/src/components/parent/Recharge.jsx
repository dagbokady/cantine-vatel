import { useRef, useState } from "react";
import { Check, FlaskConical, Smartphone, X } from "lucide-react";
import { creerRecharge, erreurApi, traiterRecharge } from "../../api/pro";
import { Alerte, Bouton } from "../EspaceLayout";
import Panneau from "../Panneau";
import { Avatar } from "../ui";
import { fcfa } from "../../utils/format";
import { OPERATEURS, formaterTel, operateur } from "../../utils/operateurs";
import { titreStyle } from "../../utils/tokens";
import OperateurLogo from "./OperateurLogo";

const MONTANTS = [1000, 2000, 5000, 10000];
const nouvelleCle = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

function BandeauSimulation() {
  return (
    <p className="mb-5 flex items-center gap-2 rounded-[14px] bg-[#F7F7F7] px-4 py-2.5 text-[13px] text-[#222222]">
      <FlaskConical size={16} className="shrink-0 text-[#FF5A5F]" aria-hidden="true" />
      <span><strong className="font-semibold">Paiement simulé.</strong> Aucun opérateur n'est contacté, aucun argent n'est débité.</span>
    </p>
  );
}

function Ligne({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[14px] text-[#717171]">{label}</dt>
      <dd className="text-right text-[15px] font-medium text-[#222222]">{children}</dd>
    </div>
  );
}

// Parcours de rechargement : formulaire, vérification, traitement, résultat.
export default function Recharge({ ouvert, onClose, enfants = [], enfantId, onTermine }) {
  const [etape, setEtape] = useState("form");
  const [f, setF] = useState({ eleve_id: enfantId ?? enfants[0]?.id, montant: 2000, operateur: "", telephone: "" });
  const [libre, setLibre] = useState("");
  const [echec, setEchec] = useState(false);
  const [tx, setTx] = useState(null);
  const [erreur, setErreur] = useState("");
  const cle = useRef(nouvelleCle());
  const envoi = useRef(false);

  const enfant = enfants.find((e) => e.id === f.eleve_id);
  const chiffres = f.telephone.replace(/\D/g, "");
  const valide = enfant && f.montant >= 500 && f.montant <= 100000 && f.operateur && /^0\d{9}$/.test(chiffres);

  const reinitialiser = () => {
    cle.current = nouvelleCle();
    setTx(null);
    setErreur("");
    setEtape("form");
  };
  const fermer = () => {
    if (etape === "traitement") return; // on ne quitte pas pendant le traitement
    if (tx && onTermine) onTermine(tx);
    reinitialiser();
    setEchec(false);
    onClose();
  };

  const confirmer = async () => {
    if (envoi.current) return; // verrou anti double clic (la clé d'idempotence protège aussi côté serveur)
    envoi.current = true;
    setErreur("");
    setEtape("traitement");
    try {
      const cree = await creerRecharge({ ...f, telephone: chiffres, cle_idempotence: cle.current, simuler_echec: echec });
      setTx(cree);
      const fin = await traiterRecharge(cree.reference);
      setTx(fin);
      setEtape("resultat");
    } catch (e) {
      setErreur(erreurApi(e, "Connexion interrompue. Le paiement n'a pas été débité."));
      setEtape("verif");
    } finally {
      envoi.current = false;
    }
  };

  const op = f.operateur ? operateur(f.operateur) : null;
  const titres = { form: "Recharger", verif: "Vérifier", traitement: "Traitement", resultat: tx?.statut === "validee" ? "C'est fait" : "Paiement échoué" };

  let pied = null;
  if (etape === "form") {
    pied = <Bouton className="h-[52px] w-full" disabled={!valide} onClick={() => setEtape("verif")}>Continuer</Bouton>;
  } else if (etape === "verif") {
    pied = (
      <div className="flex gap-2">
        <Bouton variante="doux" className="h-[52px]" onClick={() => setEtape("form")}>Retour</Bouton>
        <Bouton variante="corail" className="h-[52px] flex-1" onClick={confirmer}>Payer {fcfa(f.montant)}</Bouton>
      </div>
    );
  } else if (etape === "resultat") {
    pied = tx?.statut === "validee" ? (
      <Bouton className="h-[52px] w-full" onClick={fermer}>Terminé</Bouton>
    ) : (
      <div className="flex gap-2">
        <Bouton variante="doux" className="h-[52px] flex-1" onClick={fermer}>Fermer</Bouton>
        <Bouton className="h-[52px] flex-1" onClick={() => { if (tx && onTermine) onTermine(tx); setEchec(false); reinitialiser(); }}>Réessayer</Bouton>
      </div>
    );
  }

  return (
    <Panneau ouvert={ouvert} onClose={fermer} titre={titres[etape]} surTitre={etape === "form" ? "Portefeuille cantine" : op?.nom} pied={pied}>
      {etape !== "resultat" && <BandeauSimulation />}

      {etape === "form" && (
        <div className="space-y-6">
          {enfants.length > 1 && (
            <fieldset>
              <legend className="text-[13px] font-medium text-[#222222]">Pour qui ?</legend>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {enfants.map((e) => {
                  const actif = e.id === f.eleve_id;
                  return (
                    <button key={e.id} type="button" aria-pressed={actif} onClick={() => setF({ ...f, eleve_id: e.id })}
                      className={`flex h-14 shrink-0 items-center gap-2.5 rounded-full border pl-1.5 pr-4 transition-colors ${actif ? "border-[#222222] bg-white" : "border-[#EBEBEB] bg-white hover:border-[#222222]"}`}>
                      <Avatar nom={e.nom} photo={e.photo} taille={42} />
                      <span className="text-[14px] font-medium text-[#222222]">{e.nom.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-[13px] font-medium text-[#222222]">Montant</legend>
            <p className="mt-1 text-[40px] font-semibold leading-none text-[#222222]" style={titreStyle} aria-live="polite">{fcfa(f.montant)}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {MONTANTS.map((m) => (
                <button key={m} type="button" aria-pressed={f.montant === m && !libre}
                  onClick={() => { setLibre(""); setF({ ...f, montant: m }); }}
                  className={`h-11 rounded-full border text-[14px] font-medium transition-colors ${f.montant === m && !libre ? "border-[#222222] bg-[#222222] text-white" : "border-[#EBEBEB] text-[#222222] hover:border-[#222222]"}`}>
                  {m.toLocaleString("fr-FR")}
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Autre montant en FCFA</span>
              <input inputMode="numeric" placeholder="Autre montant (500 à 100 000 F)" value={libre}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setLibre(v); setF({ ...f, montant: Number(v) || 0 }); }}
                className="h-12 w-full rounded-[12px] border border-[#EBEBEB] px-4 text-[16px] outline-none placeholder:text-[#B0B0B0] focus:border-[#222222]" />
            </label>
            {libre && (f.montant < 500 || f.montant > 100000) && <p className="mt-1.5 text-[13px] text-[#B30000]">Entre 500 F et 100 000 F.</p>}
          </fieldset>

          <fieldset>
            <legend className="text-[13px] font-medium text-[#222222]">Moyen de paiement</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {OPERATEURS.map((o) => {
                const actif = f.operateur === o.id;
                return (
                  <button key={o.id} type="button" aria-pressed={actif} onClick={() => setF({ ...f, operateur: o.id })}
                    className={`relative flex h-[68px] items-center gap-3 rounded-[18px] px-3 text-left transition-all ${actif ? "border-2 border-[#FF5A5F] px-[11px] shadow-[0_6px_20px_rgba(255,90,95,0.12)]" : "border border-[#EBEBEB] hover:border-[#222222]"}`}>
                    <OperateurLogo id={o.id} taille={40} />
                    <span className="text-[14px] font-medium leading-tight text-[#222222]">{o.nom}</span>
                    {actif && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5A5F] text-white"><Check size={12} strokeWidth={3} /></span>}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-[13px] font-medium text-[#222222]">Numéro {op ? op.nom : "Mobile Money"}</span>
            <span className="mt-1.5 flex h-12 items-center gap-2 rounded-[12px] border border-[#EBEBEB] px-4 focus-within:border-[#222222]">
              <Smartphone size={18} className="text-[#717171]" aria-hidden="true" />
              <span className="text-[15px] text-[#717171]">+225</span>
              <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="07 00 00 00 00" value={f.telephone}
                onChange={(e) => setF({ ...f, telephone: formaterTel(e.target.value) })}
                className="min-w-0 flex-1 bg-transparent text-[16px] tracking-wide text-[#222222] outline-none placeholder:text-[#B0B0B0]" />
            </span>
          </label>
        </div>
      )}

      {etape === "verif" && enfant && op && (
        <div>
          <div className="flex items-center gap-4 rounded-[22px] bg-[#222222] p-5 text-white">
            <OperateurLogo id={op.id} taille={52} />
            <div className="min-w-0">
              <p className="text-[13px] text-white/60">Vous allez payer</p>
              <p className="text-[34px] font-semibold leading-none" style={titreStyle}>{fcfa(f.montant)}</p>
            </div>
          </div>
          <dl className="mt-4 divide-y divide-[#EBEBEB]">
            <Ligne label="Bénéficiaire">{enfant.nom}</Ligne>
            <Ligne label="Opérateur">{op.nom}</Ligne>
            <Ligne label="Numéro">+225 {f.telephone}</Ligne>
            <Ligne label="Frais">0 F</Ligne>
            <Ligne label="Nouveau solde">{fcfa(enfant.solde + f.montant)}</Ligne>
          </dl>
          <fieldset className="mt-5 rounded-[18px] border border-dashed border-[#B0B0B0] p-4">
            <legend className="px-1 text-[12px] font-medium uppercase tracking-[0.08em] text-[#717171]">Scénario de test</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-[#F7F7F7] p-1" role="radiogroup" aria-label="Résultat simulé">
              {[[false, "Réussite"], [true, "Échec"]].map(([v, l]) => (
                <button key={l} type="button" role="radio" aria-checked={echec === v} onClick={() => setEchec(v)}
                  className={`h-10 rounded-full text-[14px] font-medium ${echec === v ? "bg-white text-[#222222] shadow-[0_1px_4px_rgba(0,0,0,0.08)]" : "text-[#717171]"}`}>
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#717171]">Choisissez l'issue du paiement simulé.</p>
          </fieldset>
          <div className="mt-4"><Alerte>{erreur}</Alerte></div>
        </div>
      )}

      {etape === "traitement" && (
        <div className="flex flex-col items-center py-8 text-center" aria-live="polite">
          <div className="relative h-24 w-24">
            <span className="absolute inset-0 animate-spin rounded-full border-4 border-[#F7F7F7] border-t-[#FF5A5F]" />
            <span className="absolute inset-3 flex items-center justify-center"><OperateurLogo id={f.operateur} taille={56} /></span>
          </div>
          <p className="mt-6 text-[22px] font-semibold text-[#222222]" style={titreStyle}>Paiement en cours</p>
          <p className="mt-2 max-w-[280px] text-[14px] text-[#717171]">
            Simulation de la validation {op?.nom} pour {fcfa(f.montant)}. Ne fermez pas cette fenêtre.
          </p>
        </div>
      )}

      {etape === "resultat" && tx && (
        <div className="flex flex-col items-center pt-2 text-center">
          {tx.statut === "validee" ? (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF5A5F] text-white animate-[monte_300ms_ease]"><Check size={40} strokeWidth={2.6} /></span>
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B30000] text-white animate-[monte_300ms_ease]"><X size={40} strokeWidth={2.6} /></span>
          )}
          {tx.statut === "validee" ? (
            <>
              <p className="mt-5 text-[34px] font-semibold leading-none text-[#222222]" style={titreStyle}>+{fcfa(tx.montant)}</p>
              <p className="mt-2 text-[15px] text-[#717171]">sur le portefeuille de {tx.eleve_nom.split(" ")[0]}</p>
              <p className="mt-4 rounded-full bg-[#FFF0ED] px-4 py-2 text-[14px] text-[#222222]">Nouveau solde : <strong>{fcfa(tx.solde)}</strong></p>
            </>
          ) : (
            <>
              <p className="mt-5 text-[18px] font-semibold text-[#222222]">Aucun montant n'a été crédité</p>
              <p className="mt-2 max-w-[300px] text-[14px] text-[#B30000]">{tx.motif_echec}</p>
            </>
          )}
          <dl className="mt-6 w-full divide-y divide-[#EBEBEB] border-t border-[#EBEBEB] text-left">
            <Ligne label="Référence">{tx.reference}</Ligne>
            <Ligne label="Opérateur">{operateur(tx.operateur).nom}</Ligne>
            <Ligne label="Numéro">{tx.telephone_masque}</Ligne>
          </dl>
          <p className="mt-3 text-[12px] text-[#B0B0B0]">Transaction simulée, sans débit réel.</p>
        </div>
      )}
    </Panneau>
  );
}
