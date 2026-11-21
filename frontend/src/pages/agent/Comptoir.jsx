import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getServiceDuJour, servirTicket } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { formatHeure, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";

const ID_LECTEUR = "lecteur-qr";

function Resultat({ r, onSuivant }) {
  const ok = r.ok;
  return (
    <div
      role="status"
      className={`rounded-[22px] p-6 text-white ${ok ? "bg-[#003c33]" : "bg-[#b30000]"}`}
    >
      <p className="text-[32px] font-medium" style={titreStyle}>
        {ok ? "Servir ✓" : "Ne pas servir"}
      </p>
      {!ok && <p className="mt-1 text-[18px]">{r.raison}</p>}

      {r.eleve && (
        <div className="mt-5 flex items-center gap-4">
          <div className="rounded-full bg-white p-1">
            <Avatar nom={r.eleve.nom} photo={r.eleve.photo} taille={96} />
          </div>
          <div className="min-w-0">
            <p className="text-[28px] font-medium leading-tight" style={titreStyle}>{r.eleve.nom}</p>
            <p className="text-[16px] text-white/80">{r.eleve.classe}</p>
            {r.eleve.allergies.length > 0 && (
              <p className="mt-1 inline-block rounded-full bg-white px-3 py-0.5 text-[14px] font-medium text-[#b30000]">
                Allergie : {r.eleve.allergies.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {r.plat_nom && (
        <div className="mt-5 grid grid-cols-2 gap-3 text-[16px] sm:grid-cols-4">
          <Info label="Plat" valeur={r.plat_nom} />
          <Info label="Portion" valeur={tiersEnFraction(r.tiers)} grand />
          <Info label="Table" valeur={`${r.table_nom} · place ${r.place_numero}`} />
          <Info label="Créneau" valeur={`${formatHeure(r.heure_debut)} – ${formatHeure(r.heure_fin)}`} />
        </div>
      )}

      <Bouton variante="doux" className="mt-6 h-[52px] w-full" onClick={onSuivant}>
        Scanner le suivant
      </Bouton>
    </div>
  );
}

function Info({ label, valeur, grand }) {
  return (
    <div className="rounded-[12px] bg-white/10 p-3">
      <p className="text-[12px] uppercase tracking-[0.28px] text-white/70">{label}</p>
      <p className={grand ? "text-[28px] font-medium" : "font-medium"} style={grand ? titreStyle : undefined}>{valeur}</p>
    </div>
  );
}

export default function Comptoir() {
  const lecteur = useRef(null);
  const occupe = useRef(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [stats, setStats] = useState(null);
  const [saisie, setSaisie] = useState("");

  const rafraichir = useCallback(() => {
    getServiceDuJour().then(setStats).catch(() => {});
  }, []);

  const traiter = useCallback(
    async (ticket) => {
      if (occupe.current) return;
      occupe.current = true;
      try {
        lecteur.current?.pause(true);
      } catch {
        /* lecteur non démarré */
      }
      try {
        setResultat(await servirTicket(ticket));
        rafraichir();
      } catch (e) {
        setResultat({ ok: false, raison: e.response?.data?.detail || "Serveur injoignable." });
      }
    },
    [rafraichir],
  );

  useEffect(() => {
    rafraichir();
    const q = new Html5Qrcode(ID_LECTEUR, { verbose: false });
    lecteur.current = q;
    q.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 260 } }, traiter, () => {})
      .catch(() => setErreur("Caméra indisponible : autorise la caméra ou colle le ticket ci-dessous."));
    return () => {
      if (q.isScanning) q.stop().then(() => q.clear()).catch(() => {});
    };
  }, [traiter, rafraichir]);

  const suivant = () => {
    setResultat(null);
    setSaisie("");
    occupe.current = false;
    try {
      lecteur.current?.resume();
    } catch {
      /* lecteur non démarré */
    }
  };

  return (
    <EspaceLayout titre="Comptoir" large>
      {stats && (
        <p className="text-[15px] text-[#616161]">
          Servis aujourd'hui : <span className="font-medium text-[#212121]">{stats.servies} / {stats.commandes}</span>
        </p>
      )}

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <div id={ID_LECTEUR} className="overflow-hidden rounded-[22px] bg-[#eeece7]" style={{ minHeight: 280 }} />
          <div className="mt-3">
            <Alerte>{erreur}</Alerte>
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (saisie.trim()) traiter(saisie.trim());
            }}
          >
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="Ou colle le code du ticket"
              aria-label="Code du ticket"
              className="h-12 min-w-0 flex-1 rounded-[12px] border border-[#d9d9dd] px-4 text-[15px] outline-none focus:border-[#003c33]"
            />
            <Bouton type="submit" disabled={!saisie.trim() || !!resultat}>Vérifier</Bouton>
          </form>
        </div>

        <div>
          {resultat ? (
            <Resultat r={resultat} onSuivant={suivant} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-[22px] border border-dashed border-[#d9d9dd] p-6 text-center text-[16px] text-[#93939f]">
              Présente le QR code de l'élève devant la caméra.
            </div>
          )}
        </div>
      </div>
    </EspaceLayout>
  );
}
