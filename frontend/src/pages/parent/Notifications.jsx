import { useEffect, useState } from "react";
import { getNotifications, marquerLues } from "../../api/pro";
import EspaceLayout from "../../components/EspaceLayout";
import { ONGLETS_PARENT } from "./onglets";

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

  return (
    <EspaceLayout titre="Notifications" onglets={ONGLETS_PARENT}>
      {liste === null && <p className="text-[14px] text-[#93939f]">Chargement…</p>}
      {liste?.length === 0 && <p className="text-[15px] text-[#616161]">Aucune notification.</p>}
      <ul className="divide-y divide-[#f2f2f2]">
        {liste?.map((n) => (
          <li key={n.id} className="flex gap-3 py-3">
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${n.lue ? "bg-transparent" : "bg-[#ff7759]"}`} />
            <div>
              <p className="text-[15px] text-[#212121]">{n.message}</p>
              <p className="text-[12px] text-[#93939f]">{new Date(n.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
          </li>
        ))}
      </ul>
    </EspaceLayout>
  );
}
