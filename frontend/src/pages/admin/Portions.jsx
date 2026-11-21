import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { deciderSuggestion, erreurApi, getSuggestionsPortion } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_ADMIN } from "./onglets";

// Suggestions issues des retours d'assiettes : jamais appliquées sans décision humaine.
export default function Portions() {
  const [liste, setListe] = useState(null);
  const [msg, setMsg] = useState({ texte: "", ok: true });
  useEffect(() => { getSuggestionsPortion().then(setListe).catch(() => setListe([])); }, []);

  const decider = async (s, decision) => {
    try {
      await deciderSuggestion(s.id, decision);
      setListe((l) => l.filter((x) => x.id !== s.id));
      setMsg({
        texte: decision === "valider"
          ? `${s.eleve.nom} : portion passée à ${tiersEnFraction(s.portion_suggeree)}.`
          : `Suggestion refusée pour ${s.eleve.nom}.`,
        ok: true,
      });
    } catch (e) {
      setMsg({ texte: erreurApi(e), ok: false });
    }
  };

  return (
    <EspaceLayout titre="Portions" surTitre="Adapter sans priver, réduire le gaspillage" onglets={ONGLETS_ADMIN} large>
      <p className="max-w-[620px] text-[15px] leading-relaxed text-[#717171]">
        Le système compare ce que chaque élève termine réellement sur ses 20 derniers repas (8 au minimum).
        Il propose une portion plus grande au-delà de 85 % d'assiettes terminées, plus petite en dessous de 30 %. Rien ne change sans votre validation.
      </p>
      <div className="mt-6"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
      {liste && liste.length === 0 && (
        <p className="mt-8 rounded-[22px] bg-[#F7F7F7] p-6 text-[15px] text-[#717171]">Aucune suggestion en attente.</p>
      )}
      <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {liste?.map((s) => {
          const hausse = s.portion_suggeree > s.portion_actuelle;
          const Fleche = hausse ? ArrowUp : ArrowDown;
          return (
            <li key={s.id} className="rounded-[22px] border border-[#EBEBEB] p-5">
              <div className="flex items-center gap-3">
                <Avatar nom={s.eleve.nom} photo={s.eleve.photo} taille={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-medium">{s.eleve.nom}</p>
                  <p className="text-[13px] text-[#717171]">{s.eleve.classe}</p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium ${hausse ? "bg-[#FFF0ED] text-[#222222]" : "bg-[#F7F7F7] text-[#222222]"}`}>
                  <Fleche size={13} /> {hausse ? "Plus grande" : "Plus petite"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
                <p className="text-[36px] font-semibold leading-none" style={titreStyle}>
                  <span className="text-[#B0B0B0]">{tiersEnFraction(s.portion_actuelle)}</span>
                  <span className="mx-2 text-[22px] text-[#B0B0B0]">→</span>
                  {tiersEnFraction(s.portion_suggeree)}
                </p>
                <p className="pb-1 text-[13px] text-[#717171]">{Math.round(s.taux * 100)} % terminés sur {s.observations} repas</p>
              </div>
              <div className="mt-5 flex gap-2">
                <Bouton variante="doux" className="flex-1" onClick={() => decider(s, "refuser")}>Refuser</Bouton>
                <Bouton className="flex-1" onClick={() => decider(s, "valider")}>Valider</Bouton>
              </div>
            </li>
          );
        })}
      </ul>
    </EspaceLayout>
  );
}
