import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, Plus, TriangleAlert } from "lucide-react";
import { getEnfants, getNotifications } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { fcfa } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";
import { ONGLETS_PARENT } from "./onglets";

export default function ParentAccueil() {
  const [enfants, setEnfants] = useState(null);
  const [nonLues, setNonLues] = useState(0);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    getEnfants().then(setEnfants).catch(() => setErreur("Impossible de charger tes enfants."));
    getNotifications().then((n) => setNonLues(n.filter((x) => !x.lue).length)).catch(() => {});
  }, []);

  return (
    <EspaceLayout titre="Mes enfants" onglets={ONGLETS_PARENT}>
      {nonLues > 0 && (
        <Link to="/parent/notifications" className="mb-6 flex min-h-14 items-center gap-3 rounded-[18px] bg-[#FFF0ED] px-4 text-[15px] text-[#222222]">
          <span className="relative">
            <Bell size={19} strokeWidth={1.75} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF5A5F]" />
          </span>
          <span className="flex-1">{nonLues} nouvelle{nonLues > 1 ? "s" : ""} notification{nonLues > 1 ? "s" : ""}</span>
          <ChevronRight size={18} className="text-[#717171]" />
        </Link>
      )}
      <Alerte>{erreur}</Alerte>
      {enfants === null && !erreur && <p className="text-[14px] text-[#B0B0B0]">Chargement…</p>}
      {enfants?.length === 0 && (
        <div className="rounded-[22px] bg-[#F7F7F7] px-6 py-12 text-center">
          <p className="text-[22px] font-semibold" style={titreStyle}>Aucun enfant rattaché</p>
          <p className="mx-auto mt-2 max-w-[300px] text-[15px] text-[#717171]">Ajoute ton enfant avec le matricule fourni par l'établissement.</p>
        </div>
      )}
      <ul className="space-y-4">
        {enfants?.map((e) => (
          <li key={e.id}>
            <Link to={`/parent/enfant/${e.id}`} className="group block overflow-hidden rounded-[22px] border border-[#EBEBEB] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-4 p-5">
                <Avatar nom={e.nom} photo={e.photo} taille={60} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[20px] font-semibold" style={titreStyle}>{e.nom}</p>
                  <p className="truncate text-[14px] text-[#717171]">{e.classe} · {e.matricule}</p>
                </div>
                <ChevronRight size={20} className="shrink-0 text-[#B0B0B0] transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-[#EBEBEB] bg-[#F7F7F7] px-5 py-4">
                <div>
                  <p className="text-[12px] text-[#717171]">Solde</p>
                  <p className={`text-[26px] font-semibold leading-none ${e.solde < 0 ? "text-[#B30000]" : "text-[#222222]"}`} style={titreStyle}>{fcfa(e.solde)}</p>
                </div>
                {e.allergies.length > 0 ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#B30000]">
                    <TriangleAlert size={13} /> {e.allergies.join(", ")}
                  </span>
                ) : (
                  <span className="text-[13px] font-medium text-[#FF5A5F]">Recharger →</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/parent/ajouter" className="mt-5 flex h-14 items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#B0B0B0] text-[15px] font-medium text-[#222222] transition-colors hover:border-[#222222]">
        <Plus size={18} /> Ajouter un enfant
      </Link>
    </EspaceLayout>
  );
}
