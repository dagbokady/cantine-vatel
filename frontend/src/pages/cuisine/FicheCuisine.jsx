import { useEffect, useState } from "react";
import { getFiche } from "../../api/pro";
import EspaceLayout, { Carte } from "../../components/EspaceLayout";
import { Avatar, Libelle } from "../../components/ui";
import { tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_CUISINE } from "./onglets";

const n = (x) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

function Tableau({ titre, lignes }) {
  if (!lignes.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[13px] text-[#93939f]">{titre}</p>
      <table className="mt-1 w-full text-[14px]">
        <tbody>
          {lignes.map((l) => (
            <tr key={l.cle} className="border-t border-[#f2f2f2]">
              <td className="py-1.5 text-[#212121]">{l.cle}</td>
              <td className="py-1.5 text-right text-[#616161]">{l.commandes} cmd</td>
              <td className="py-1.5 text-right font-medium text-[#212121]">{n(l.portions)} port.</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FicheCuisine() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fiche, setFiche] = useState(null);
  useEffect(() => { getFiche(date).then(setFiche).catch(() => setFiche(null)); }, [date]);

  return (
    <EspaceLayout titre="Fiche cuisine" onglets={ONGLETS_CUISINE} large>
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date"
          className="h-12 rounded-[12px] border border-[#d9d9dd] px-4 text-[15px]" />
        {fiche && <p className="text-[14px] text-[#616161]">Marge de sécurité : {fiche.marge * 100} %</p>}
        <button type="button" onClick={() => window.print()} className="min-h-12 text-[14px] text-[#003c33] underline">Imprimer</button>
      </div>

      {fiche && fiche.plats.length === 0 && <p className="mt-6 text-[15px] text-[#616161]">Aucun menu publié ce jour-là.</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fiche?.plats.map((p) => (
          <Carte key={p.plat_nom}>
            <p className="text-[16px] font-medium text-[#212121]">{p.plat_nom}</p>
            <p className="text-[13px] text-[#93939f]">{p.type === "sans_allergene" ? "Sans allergène" : p.type === "accompagnement" ? "Accompagnement" : "Plat principal"}</p>
            <p className="mt-3 text-[32px] font-medium text-[#003c33]" style={titreStyle}>{n(p.portions_avec_marge)} <span className="text-[16px]">portions à préparer</span></p>
            <p className="text-[14px] text-[#616161]">{p.commandes} commandes = {n(p.portions)} portions · stock prévu {n(p.stock_prevu_portions)}</p>
            <Tableau titre="Par créneau" lignes={p.par_creneau} />
            <Tableau titre="Par classe" lignes={p.par_classe} />
          </Carte>
        ))}
      </div>

      {fiche?.classes_mode_classe.length > 0 && (
        <section className="mt-8">
          <Libelle>Mode Classe (primaire)</Libelle>
          <div className="mt-2 flex flex-wrap gap-3">
            {fiche.classes_mode_classe.map((c) => (
              <Carte key={c.classe} className="min-w-[200px]">
                <p className="font-medium">{c.classe}</p>
                <p className="text-[14px] text-[#616161]">{c.effectif} plateaux dont {c.sans_allergene} sans allergène</p>
              </Carte>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <Libelle>Plateaux sans allergène nominatifs ({fiche?.plateaux_sans_allergene.length || 0})</Libelle>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {fiche?.plateaux_sans_allergene.map((p, i) => (
            <li key={i} className="flex items-center gap-3 rounded-[12px] border border-[#f2f2f2] p-3">
              <Avatar nom={p.nom} photo={p.photo} taille={48} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#212121]">{p.nom} <span className="font-normal text-[#616161]">· {p.classe}</span></p>
                <p className="text-[13px] text-[#b30000]">Allergie : {p.allergies.join(", ")}</p>
                <p className="text-[13px] text-[#616161]">{p.plat_nom} · {tiersEnFraction(p.portion)} · {p.creneau} · {p.place}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </EspaceLayout>
  );
}
