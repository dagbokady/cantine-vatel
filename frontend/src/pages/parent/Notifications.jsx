import { useEffect, useState } from "react";
import { BellOff } from "lucide-react";
import { getNotifications, marquerLues } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { ONGLETS_PARENT } from "./onglets";

const jour = (iso) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function Notifications() {
  const [liste, setListe] = useState(null);
  useEffect(() => {
    getNotifications()
      .then((n) => {
        setListe(n);
        if (n.some((x) => !x.lue)) marquerLues().catch(() => {});
      })
      .catch(() => setListe([]));
  }, []);

  // Regroupement par jour, dans l'ordre reçu.
  const groupes = [];
  liste?.forEach((n) => {
    const j = jour(n.created_at);
    if (groupes.at(-1)?.jour !== j) groupes.push({ jour: j, items: [] });
    groupes.at(-1).items.push(n);
  });

  return (
    <EspaceLayout titre="Notifications" surTitre="Activité de tes enfants" onglets={ONGLETS_PARENT}>
      {liste === null && <p className="text-[14px] text-[#B0B0B0]">Chargement…</p>}
      {liste?.length === 0 && (
        <div className="flex flex-col items-center rounded-[22px] bg-[#F7F7F7] px-6 py-12 text-center">
          <BellOff size={26} strokeWidth={1.5} className="text-[#B0B0B0]" />
          <p className="mt-3 text-[15px] text-[#717171]">Aucune notification pour le moment.</p>
        </div>
      )}
      {groupes.map((g) => (
        <section key={g.jour} className="mb-6">
          <p className="mb-2 text-[13px] font-medium capitalize text-[#717171]">{g.jour}</p>
          <ul className="overflow-hidden rounded-[22px] border border-[#EBEBEB]">
            {g.items.map((n) => (
              <li key={n.id} className={`flex gap-3 border-t border-[#EBEBEB] px-5 py-4 first:border-t-0 ${n.lue ? "" : "bg-[#FFF0ED]/50"}`}>
                <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${n.lue ? "bg-[#EBEBEB]" : "bg-[#FF5A5F]"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug text-[#222222]">{n.message}</p>
                  <p className="mt-1 text-[12px] text-[#B0B0B0]">{new Date(n.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </EspaceLayout>
  );
}
