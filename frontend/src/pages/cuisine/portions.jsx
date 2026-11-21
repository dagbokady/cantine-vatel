import { tiersEnFraction } from "../../utils/format";

// Tableau Portion / Quantité, lisible d'un coup d'œil en cuisine.
export function TableauPortions({ par = {}, className = "", sombre = false }) {
  const lignes = [1, 2, 3].map((t) => [t, Number(par[t] ?? par[String(t)] ?? 0)]);
  const bord = sombre ? "border-[#222222]/10" : "border-[#EBEBEB]";
  return (
    <table className={`w-full border-collapse text-[14px] ${className}`}>
      <thead>
        <tr className={`border-b ${bord} text-[12px] text-[#717171]`}>
          <th scope="col" className="py-1.5 text-left font-medium">Portion</th>
          <th scope="col" className="py-1.5 text-right font-medium">Quantité</th>
        </tr>
      </thead>
      <tbody>
        {lignes.map(([t, n]) => (
          <tr key={t} className={`border-b last:border-b-0 ${bord}`}>
            <th scope="row" className="py-2 text-left font-medium text-[#222222]">{tiersEnFraction(t)}</th>
            <td className={`py-2 text-right text-[17px] font-semibold tabular-nums ${n ? "text-[#222222]" : "text-[#B0B0B0]"}`}>{n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
