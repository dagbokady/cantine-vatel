import { useEffect, useState } from "react";
import { getMenuSemaine } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { decouperNomPlat, fcfa } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_PARENT } from "./onglets";

const TYPE = { principal: "Plat du jour", sans_allergene: "Sans allergène", accompagnement: "Accompagnement" };

export default function MenuSemaine() {
  const [jours, setJours] = useState(null);
  useEffect(() => { getMenuSemaine().then(setJours).catch(() => setJours([])); }, []);
  const auj = new Date().toISOString().slice(0, 10);

  return (
    <EspaceLayout titre="Menu de la semaine" surTitre="Au programme" onglets={ONGLETS_PARENT}>
      {jours === null && <p className="text-[14px] text-[#B0B0B0]">Chargement…</p>}
      {jours?.length === 0 && <p className="rounded-[22px] bg-[#F7F7F7] px-6 py-12 text-center text-[15px] text-[#717171]">Le menu n'est pas encore publié.</p>}
      <div className="space-y-8">
        {jours?.map((j) => {
          const d = new Date(j.date);
          const estAuj = j.date === auj;
          return (
            <section key={j.date} className="sm:grid sm:grid-cols-[56px_1fr] sm:gap-4">
              <div className="mb-3 flex items-center gap-3 sm:mb-0 sm:block sm:text-center">
                <p className={`order-2 text-[15px] font-medium capitalize sm:order-none sm:uppercase sm:text-[12px] ${estAuj ? "text-[#FF5A5F]" : "text-[#717171]"}`}>
                  <span className="sm:hidden">{d.toLocaleDateString("fr-FR", { weekday: "long" })}{estAuj && " · aujourd'hui"}</span>
                  <span className="hidden sm:inline">{d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</span>
                </p>
                <p className={`flex h-11 w-11 shrink-0 items-center sm:mx-auto sm:mt-1 sm:h-12 sm:w-12 justify-center rounded-full text-[22px] font-semibold ${estAuj ? "bg-[#FF5A5F] text-white" : "bg-[#F7F7F7] text-[#222222]"}`} style={titreStyle}>
                  {d.getDate()}
                </p>
              </div>
              <div className="space-y-3">
                {j.plats.map((p) => {
                  const { nom, mention } = decouperNomPlat(p.nom);
                  return (
                    <article key={p.nom} className="flex gap-4 rounded-[22px] border border-[#EBEBEB] p-3 pr-4">
                      {p.photo ? (
                        <img src={p.photo} alt="" className="h-20 w-20 shrink-0 rounded-[16px] object-cover" />
                      ) : (
                        <span className="h-20 w-20 shrink-0 rounded-[16px] bg-[#FFF0ED]" />
                      )}
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-[12px] text-[#717171]">{TYPE[p.type] || p.type}</p>
                        <p className="text-[16px] font-semibold leading-snug text-[#222222]">{nom}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                          <span className="font-medium text-[#222222]">{fcfa(p.prix)}</span>
                          {mention && <span className="rounded-full bg-[#F7F7F7] px-2 py-0.5 text-[12px] text-[#717171]">{mention}</span>}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[13px] text-[#717171]">{p.ingredients.join(", ")}</p>
                        <p className={`mt-0.5 text-[12px] ${p.allergenes.length ? "font-medium text-[#B30000]" : "text-[#B0B0B0]"}`}>
                          {p.allergenes.length ? `Allergènes : ${p.allergenes.join(", ")}` : "Aucun allergène"}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </EspaceLayout>
  );
}
