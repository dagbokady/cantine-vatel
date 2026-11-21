import { useEffect, useState } from "react";
import { getMenuSemaine } from "../../api/pro";
import EspaceLayout, { Carte } from "../../components/EspaceLayout";
import { Libelle } from "../../components/ui";
import { decouperNomPlat, fcfa } from "../../utils/format";
import { ONGLETS_PARENT } from "./onglets";

const TYPE = { principal: "Plat du jour", sans_allergene: "Sans allergène", accompagnement: "Accompagnement" };

export default function MenuSemaine() {
  const [jours, setJours] = useState(null);
  useEffect(() => { getMenuSemaine().then(setJours).catch(() => setJours([])); }, []);
  const auj = new Date().toISOString().slice(0, 10);

  return (
    <EspaceLayout titre="Menu de la semaine" onglets={ONGLETS_PARENT}>
      {jours === null && <p className="text-[14px] text-[#93939f]">Chargement…</p>}
      {jours?.length === 0 && <p className="text-[15px] text-[#616161]">Le menu n'est pas encore publié.</p>}
      {jours?.map((j) => (
        <section key={j.date} className="mb-6">
          <Libelle>
            {new Date(j.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            {j.date === auj && " · aujourd'hui"}
          </Libelle>
          <div className="mt-2 space-y-2">
            {j.plats.map((p) => {
              const { nom, mention } = decouperNomPlat(p.nom);
              return (
                <Carte key={p.nom} className="border-[#f2f2f2]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[16px] font-medium text-[#212121]">{nom}</span>
                    {mention && <span className="rounded-full bg-[#eeece7] px-2.5 py-0.5 text-[12px]">{mention}</span>}
                  </div>
                  <p className="text-[14px] text-[#616161]">{fcfa(p.prix)} · {TYPE[p.type] || p.type}</p>
                  <p className="mt-1 text-[13px] text-[#616161]">{p.ingredients.join(", ")}</p>
                  <p className={`text-[13px] ${p.allergenes.length ? "text-[#b30000]" : "text-[#93939f]"}`}>
                    {p.allergenes.length ? `Allergènes : ${p.allergenes.join(", ")}` : "Aucun allergène"}
                  </p>
                </Carte>
              );
            })}
          </div>
        </section>
      ))}
    </EspaceLayout>
  );
}
