import { useEffect, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { envoyerAppel, erreurApi, getAppel, getClassesEnseignant } from "../../api/pro";
import EspaceLayout, { Alerte } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { titreStyle } from "../../utils/tokens";

const heure = (iso) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const aujourdHui = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function Appel() {
  const [classes, setClasses] = useState(null);
  const [classeId, setClasseId] = useState(null);
  const [appel, setAppel] = useState(null);
  const [absents, setAbsents] = useState(new Set());
  const [envoi, setEnvoi] = useState(false);
  const [msg, setMsg] = useState({ texte: "", ok: true });

  useEffect(() => {
    getClassesEnseignant()
      .then((c) => { setClasses(c); if (c[0]) setClasseId(c[0].id); })
      .catch(() => setClasses([]));
  }, []);
  useEffect(() => {
    if (!classeId) return;
    getAppel(classeId).then((a) => {
      setAppel(a);
      setMsg({ texte: "", ok: true });
      setAbsents(new Set(a.eleves.filter((e) => e.present === false).map((e) => e.id)));
    });
  }, [classeId]);

  const basculer = (id) => {
    const s = new Set(absents);
    s.has(id) ? s.delete(id) : s.add(id);
    setAbsents(s);
  };

  const enregistrer = async () => {
    setEnvoi(true);
    try {
      const a = await envoyerAppel(classeId, [...absents]);
      setAppel(a);
      setMsg({ texte: `Appel enregistré à ${heure(a.valide_a)}. Les parents sont prévenus.`, ok: true });
    } catch (e) {
      setMsg({ texte: erreurApi(e), ok: false });
    } finally {
      setEnvoi(false);
    }
  };

  const total = appel?.eleves.length || 0;
  const presents = total - absents.size;
  const allergiques = appel?.eleves.filter((e) => e.allergies.length) || [];

  return (
    <EspaceLayout titre={appel ? appel.classe : "Appel"} surTitre={`Appel du ${aujourdHui}`}>
      {classes?.length > 1 && (
        <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
          {classes.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClasseId(c.id)}
              aria-pressed={c.id === classeId}
              className={`h-10 shrink-0 rounded-full px-4 text-[14px] transition-colors ${
                c.id === classeId ? "bg-[#222222] font-medium text-white" : "border border-[#EBEBEB] text-[#222222] hover:border-[#222222]"
              }`}
            >
              {c.nom}
            </button>
          ))}
        </div>
      )}
      {classes?.length === 0 && <p className="text-[15px] text-[#717171]">Aucune classe ne vous est attribuée.</p>}

      {appel && (
        <div className="pb-24">
          <div className="grid grid-cols-3 divide-x divide-[#EBEBEB] rounded-[22px] border border-[#EBEBEB] py-4">
            <Stat valeur={presents} label="présents" accent />
            <Stat valeur={absents.size} label={`absent${absents.size > 1 ? "s" : ""}`} />
            <Stat valeur={allergiques.length} label="allergies" />
          </div>

          {allergiques.length > 0 && (
            <div className="mt-4 flex gap-3 rounded-[18px] bg-[#FFF0ED] p-4">
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-[#B30000]" />
              <div className="text-[14px] leading-relaxed text-[#222222]">
                <p className="font-medium">À surveiller au service</p>
                {allergiques.map((e) => (
                  <p key={e.id} className="text-[#717171]">
                    {e.nom} — <span className="text-[#B30000]">{e.allergies.join(", ")}</span>
                    {e.sans_allergene && " · plateau sans allergène"}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="text-[20px] font-semibold" style={titreStyle}>Élèves</h2>
            <p className="text-[13px] text-[#717171]">Touchez un élève absent</p>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {appel.eleves.map((e) => {
              const absent = absents.has(e.id);
              const allergique = e.allergies.length > 0;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => basculer(e.id)}
                    aria-pressed={!absent}
                    aria-label={`${e.nom} : ${absent ? "absent" : "présent"}`}
                    className={`relative flex w-full flex-col items-center rounded-[22px] border px-3 pb-4 pt-5 text-center transition-all ${
                      absent ? "border-dashed border-[#B0B0B0] bg-[#F7F7F7]" : "border-[#EBEBEB] bg-white hover:border-[#222222]"
                    }`}
                  >
                    <span className={`relative ${absent ? "opacity-40 grayscale" : ""}`}>
                      <Avatar nom={e.nom} photo={e.photo} taille={64} />
                      {!absent && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#FF5A5F] text-white">
                          <Check size={13} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className={`mt-3 text-[15px] font-medium leading-tight ${absent ? "text-[#717171]" : "text-[#222222]"}`}>{e.nom}</span>
                    <span className={`mt-1 text-[12px] ${absent ? "font-medium text-[#717171]" : "text-[#B0B0B0]"}`}>
                      {absent ? "Absent" : "Présent"}
                    </span>
                    {allergique && (
                      <span className="mt-2 rounded-full bg-[#FFF0ED] px-2.5 py-0.5 text-[12px] font-medium text-[#B30000]">
                        {e.allergies.join(", ")}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
        </div>
      )}

      {appel && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EBEBEB] bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto flex max-w-[680px] items-center gap-4">
            <p className="min-w-0 flex-1 text-[13px] leading-snug text-[#717171]">
              {appel.valide_a ? <>Validé à <span className="font-medium text-[#222222]">{heure(appel.valide_a)}</span></> : "Appel non envoyé"}
            </p>
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi}
              className="h-[52px] shrink-0 rounded-full bg-[#222222] px-6 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:bg-[#EBEBEB] disabled:text-[#B0B0B0]"
            >
              {envoi ? "Envoi…" : `${appel.valide_a ? "Mettre à jour" : "Valider"} · ${presents} présents`}
            </button>
          </div>
        </div>
      )}
    </EspaceLayout>
  );
}

function Stat({ valeur, label, accent }) {
  return (
    <div className="text-center">
      <p className={`text-[30px] font-semibold leading-none ${accent ? "text-[#FF5A5F]" : "text-[#222222]"}`} style={titreStyle}>{valeur}</p>
      <p className="mt-1.5 text-[12px] text-[#717171]">{label}</p>
    </div>
  );
}
