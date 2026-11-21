import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ReservationProvider } from "./hooks/useReservation";
import { I18nProvider } from "./utils/i18n";
import RequireAuth from "./components/RequireAuth";
import VeilleBorne from "./components/eleve/VeilleBorne";
import MiseAJour from "./pwa/MiseAJour";
import Login from "./pages/eleve/Login";
import Accueil from "./pages/eleve/Accueil";
import Profil from "./pages/eleve/Profil";
import Reservation from "./pages/eleve/Reservation";
import Quantite from "./pages/eleve/Quantite";
import Composition from "./pages/eleve/Composition";
import Horaire from "./pages/eleve/Horaire";
import Place from "./pages/eleve/Place";
import MenusAVenir from "./pages/eleve/MenusAVenir";
import Connexion from "./pages/pro/Connexion";
import Landing from "./pages/Landing";
import Comptoir from "./pages/agent/Comptoir";
import ParentAccueil from "./pages/parent/ParentAccueil";
import AjouterEnfant from "./pages/parent/AjouterEnfant";
import Enfant from "./pages/parent/Enfant";
import MenuSemaine from "./pages/parent/MenuSemaine";
import Notifications from "./pages/parent/Notifications";
import Paiements from "./pages/parent/Paiements";
import Service from "./pages/cuisine/Service";
import SalleCuisine from "./pages/cuisine/Salle";
import Retours from "./pages/cuisine/Retours";
import Menus from "./pages/cuisine/Menus";
import Plats from "./pages/cuisine/Plats";
import Ingredients from "./pages/cuisine/Ingredients";
import TableauDeBord from "./pages/admin/TableauDeBord";
import Creneaux from "./pages/admin/Creneaux";
import Salle from "./pages/admin/Salle";
import Parametres from "./pages/admin/Parametres";
import Portions from "./pages/admin/Portions";
import Statistiques from "./pages/admin/Statistiques";
import Eleves from "./pages/admin/Eleves";
import StatistiquesCuisine from "./pages/cuisine/Statistiques";
import Appel from "./pages/enseignant/Appel";

const R = (roles, el) => <RequireAuth roles={roles}>{el}</RequireAuth>;

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ReservationProvider>
          <BrowserRouter>
              <VeilleBorne />
              <MiseAJour />
              <Routes>
                <Route path="/decouvrir" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/borne" element={<Login borne />} />
                <Route
                  path="/menus"
                  element={
                    <RequireAuth>
                      <MenusAVenir />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <Accueil />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profil"
                  element={
                    <RequireAuth>
                      <Profil />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservation"
                  element={
                    <RequireAuth>
                      <Reservation />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservation/composition"
                  element={
                    <RequireAuth>
                      <Composition />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservation/quantite"
                  element={
                    <RequireAuth>
                      <Quantite />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservation/horaire"
                  element={
                    <RequireAuth>
                      <Horaire />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/reservation/place"
                  element={
                    <RequireAuth>
                      <Place />
                    </RequireAuth>
                  }
                />
                <Route path="/pro" element={<Connexion />} />
                <Route path="/comptoir" element={R(["agent", "admin"], <Comptoir />)} />
                <Route path="/parent" element={R(["parent"], <ParentAccueil />)} />
                <Route path="/parent/ajouter" element={R(["parent"], <AjouterEnfant />)} />
                <Route path="/parent/enfant/:id" element={R(["parent"], <Enfant />)} />
                <Route path="/parent/menu" element={R(["parent"], <MenuSemaine />)} />
                <Route path="/parent/notifications" element={R(["parent"], <Notifications />)} />
                <Route path="/parent/paiements" element={R(["parent"], <Paiements />)} />
                <Route path="/cuisine" element={R(["cuisine", "admin"], <Service />)} />
                <Route path="/cuisine/salle" element={R(["cuisine", "admin"], <SalleCuisine />)} />
                <Route path="/cuisine/retours" element={R(["cuisine", "admin"], <Retours />)} />
                <Route path="/cuisine/statistiques" element={R(["cuisine", "admin"], <StatistiquesCuisine />)} />
                <Route path="/cuisine/menus" element={R(["cuisine", "admin"], <Menus />)} />
                <Route path="/cuisine/plats" element={R(["cuisine", "admin"], <Plats />)} />
                <Route path="/cuisine/ingredients" element={R(["cuisine", "admin"], <Ingredients />)} />
                <Route path="/admin" element={R(["admin"], <TableauDeBord />)} />
                <Route path="/admin/statistiques" element={R(["admin"], <Statistiques />)} />
                <Route path="/admin/eleves" element={R(["admin"], <Eleves />)} />
                <Route path="/admin/creneaux" element={R(["admin"], <Creneaux />)} />
                <Route path="/admin/salle" element={R(["admin"], <Salle />)} />
                <Route path="/admin/portions" element={R(["admin"], <Portions />)} />
                <Route path="/admin/parametres" element={R(["admin"], <Parametres />)} />
                <Route path="/enseignant" element={R(["enseignant"], <Appel />)} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </BrowserRouter>
        </ReservationProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
