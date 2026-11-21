import { useEffect, useState } from "react";
import { envoyerAppel, erreurApi, getAppel, getClassesEnseignant } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";

export default function Appel() {
  const [classes, setClasses] = useState([]);
  const [classeId, setClasseId] = useState(null);
  const [appel, setAppel] = useState(null);
  const [absents, setAbsents] = useState(new Set());
  const [etape, setEtape] = useState("liste"); // liste → valide (décocher les absents)
  const [msg, setMsg] = useState({ texte: "", ok: true });

  useEffect(() => {
    getClassesEnseignant().then((c) => { setClasses(c); if (c[0]) setClasseId(c[0].id); });
  }, []);
  useEffect(() => {
    if (!classeId) return;
    getAppel(classeId).then((a) => {
      setAppel(a);
      setAbsents(new Set(a.eleves.filter((e) => e.present === false).map((e) => e.id)));
      setEtape(a.valide_a ? "valide" : "liste");
    });
  }, [classeId]);

  const basculer = (id) => {
    const s = new Set(absents);
    s.has(id) ? s.delete(id) : s.add(id);
    setAbsents(s);
  };

  const enregistrer = async () => {
    try {
      const a = await envoyerAppel(classeId, [...absents]);
      setAppel(a);
      setEtape("valide");
      setMsg({ texte: `Appel enregistré à ${new Date(a.valide_a).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Les parents sont prévenus.`, ok: true });
    } catch (e) { setMsg({ texte: erreurApi(e), ok: false }); }
  };

  const nbAllergiques = appel?.eleves.filter((e) => e.allergies.length).length || 0;

  return (
    <EspaceLayout titre={appel ? `Appel · ${appel.classe}` : "Appel"}>
      {classes.length > 1 && (
        <select value={classeId || ""} onChange={(e) => setClasseId(Number(e.target.value))} className="mb-4 h-12 rounded-[12px] border border-[#d9d9dd] px-3">
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      )}
      {classes.length === 0 && <p className="text-[15px] text-[#616161]">Aucune classe ne vous est attribuée.</p>}
      {appel && (
        <>
          <p className="text-[15px] text-[#616161]">
            {appel.eleves.length} élèves · <span className="text-[#b30000]">{nbAllergiques} allergiques</span>
            {etape === "valide" && ` · ${appel.eleves.length - absents.size} présents`}
          </p>
          {etape === "liste" ? (
            <Bouton variante="vert" className="mt-4 h-[52px] w-full" onClick={() => setEtape("valide")}>Toute la classe est là</Bouton>
          ) : (
            <p className="mt-4 text-[14px] text-[#616161]">Touchez un élève absent pour le décocher.</p>
          )}
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {appel.eleves.map((e) => {
              const absent = absents.has(e.id);
              const rouge = e.allergies.length > 0;
              return (
                <li key={e.id}>
                  <button type="button" disabled={etape === "liste"} onClick={() => basculer(e.id)} aria-pressed={!absent}
                    className={`flex w-full flex-col items-center rounded-[16px] p-3 text-center transition-opacity ${rouge ? "border-2 border-[#b30000] bg-[#fff1f1]" : "border border-[#d9d9dd]"} ${absent ? "opacity-40" : ""}`}>
                    <Avatar nom={e.nom} photo={e.photo} taille={64} />
                    <span className="mt-2 text-[15px] font-medium text-[#212121]">{e.nom}</span>
                    {rouge && <span className="text-[13px] font-medium text-[#b30000]">{e.allergies.join(", ")}{e.sans_allergene && " · plateau sans allergène"}</span>}
                    {etape === "valide" && <span className={`mt-1 text-[13px] ${absent ? "text-[#616161]" : "text-[#003c33]"}`}>{absent ? "Absent" : "Présent"}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {etape === "valide" && (
            <Bouton className="mt-6 h-[52px] w-full" onClick={enregistrer}>Valider l'appel ({appel.eleves.length - absents.size} présents)</Bouton>
          )}
          <div className="mt-4"><Alerte ok={msg.ok}>{msg.texte}</Alerte></div>
        </>
      )}
    </EspaceLayout>
  );
}
