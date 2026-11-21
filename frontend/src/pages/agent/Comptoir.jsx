import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { getServiceDuJour, servirCode, servirTicket } from "../../api/pro";
import EspaceLayout, { Alerte, Bouton } from "../../components/EspaceLayout";
import { Avatar } from "../../components/ui";
import { formatHeure, tiersEnFraction } from "../../utils/format";
import { titreStyle } from "../../utils/tokens";

const ID_LECTEUR = "lecteur-qr";
// Après « Suivant », le QR encore devant la caméra ne doit pas être relu aussitôt.
const DELAI_RELECTURE_MS = 4000;
// Code de secours : 6 caractères, sans 0/O ni 1/I. Tout le reste est traité comme un ticket QR.
const estCodeCourt = (v) => /^[2-9A-HJ-NP-Z]{6}$/.test(v.replace(/[\s-]/g, "").toUpperCase());

function Resultat({ r, onSuivant }) {
  const ok = r.ok;
  return (
    <div
      role="status"
      className={`rounded-[22px] p-6 text-white ${ok ? "bg-[#222222]" : "bg-[#B30000]"}`}
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

      {r.composition?.length > 0 && (
        <p className="mt-5 rounded-[12px] bg-white/10 px-3 py-2 text-[15px]">
          <span className="text-white/70">Composition : </span>{r.composition.join(" · ")}
        </p>
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
  const dernier = useRef({ ticket: null, a: 0 });
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [stats, setStats] = useState(null);
  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const rafraichir = useCallback(() => {
    getServiceDuJour().then(setStats).catch(() => {});
  }, []);

  const traiter = useCallback(
    async (ticket, { camera = false } = {}) => {
      if (occupe.current) return;
      const d = dernier.current;
      if (camera && d.ticket === ticket && Date.now() - d.a < DELAI_RELECTURE_MS) return;
      occupe.current = true;
      dernier.current = { ticket, a: Date.now() };
      const q = lecteur.current;
      if (q?.getState() === Html5QrcodeScannerState.SCANNING) q.pause(true);
      setEnvoi(true);
      try {
        setResultat(await (!camera && estCodeCourt(ticket) ? servirCode(ticket) : servirTicket(ticket)));
        rafraichir();
      } catch (e) {
        setResultat({ ok: false, raison: e.response?.data?.detail || "Serveur injoignable." });
      } finally {
        setEnvoi(false);
      }
    },
    [rafraichir],
  );

  useEffect(() => {
    rafraichir();
    const q = new Html5Qrcode(ID_LECTEUR, { verbose: false });
    lecteur.current = q;
    // start() est asynchrone : l'arrêt doit attendre la fin du démarrage, sinon
    // (double montage en développement) une seconde caméra continue de lire.
    const demarrage = q
      .start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 260 } }, (t) => traiter(t, { camera: true }), () => {})
      .catch(() => setErreur("Caméra indisponible : autorise la caméra ou saisis le code ci-dessous."));
    return () => {
      if (lecteur.current === q) lecteur.current = null;
      demarrage
        .then(() => {
          if (q.getState() !== Html5QrcodeScannerState.NOT_STARTED) return q.stop().then(() => q.clear());
        })
        .catch(() => {});
    };
  }, [traiter, rafraichir]);

  const suivant = () => {
    setResultat(null);
    setSaisie("");
    dernier.current = { ...dernier.current, a: Date.now() };
    occupe.current = false;
    const q = lecteur.current;
    if (q?.getState() === Html5QrcodeScannerState.PAUSED) q.resume();
  };

  return (
    <EspaceLayout titre="Comptoir" large>
      {stats && (
        <p className="text-[15px] text-[#717171]">
          Servis aujourd'hui : <span className="font-medium text-[#222222]">{stats.servies} / {stats.commandes}</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div id={ID_LECTEUR} className="w-full max-w-full overflow-hidden rounded-[22px] bg-[#F7F7F7]" style={{ minHeight: 280 }} />
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
              placeholder="Code de secours (ex. A7K9P2)"
              aria-label="Code de secours à 6 caractères ou code du ticket"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 rounded-[12px] border border-[#EBEBEB] px-4 font-mono text-[16px] uppercase tracking-[0.12em] outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal focus:border-[#222222]"
            />
            <Bouton type="submit" disabled={!saisie.trim() || !!resultat || envoi}>{envoi ? "…" : "Vérifier"}</Bouton>
          </form>
        </div>

        <div>
          {resultat ? (
            <Resultat r={resultat} onSuivant={suivant} />
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-[22px] border border-dashed border-[#EBEBEB] p-6 text-center text-[16px] text-[#B0B0B0]">
              Présente le QR code de l'élève devant la caméra.
            </div>
          )}
        </div>
      </div>
    </EspaceLayout>
  );
}
