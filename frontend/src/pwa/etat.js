// État PWA partagé : invitation d'installation et mise à jour disponible.
// Les événements sont capturés dès le chargement, avant le montage de React.
let invitation = null;
let enAttente = null;
const abonnes = new Set();
const notifier = () => abonnes.forEach((f) => f());

export const estInstallee = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

export function demarrerPwa() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // le bouton « Installer » de l'application déclenche l'invitation
    invitation = e;
    notifier();
  });
  window.addEventListener("appinstalled", () => {
    invitation = null;
    notifier();
  });

  // Service worker : production et contexte sécurisé uniquement (HTTPS ou localhost).
  if (!import.meta.env.PROD || !("serviceWorker" in navigator) || !window.isSecureContext) return;
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      const suivre = (sw) => {
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            enAttente = sw;
            notifier();
          }
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) {
        enAttente = reg.waiting;
        notifier();
      }
      reg.addEventListener("updatefound", () => suivre(reg.installing));
      // Vérifie régulièrement une nouvelle version (application laissée ouverte, bornes).
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
      let recharge = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (recharge) return;
        recharge = true;
        window.location.reload();
      });
    } catch {
      /* service worker indisponible : l'application fonctionne normalement en ligne */
    }
  });
}

export const etatPwa = () => ({ installable: !!invitation && !estInstallee(), majDisponible: !!enAttente });

export function abonner(f) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export async function installer() {
  if (!invitation) return false;
  const e = invitation;
  invitation = null;
  notifier();
  await e.prompt();
  const { outcome } = await e.userChoice;
  return outcome === "accepted";
}

export function mettreAJour() {
  enAttente?.postMessage("SKIP_WAITING");
}
