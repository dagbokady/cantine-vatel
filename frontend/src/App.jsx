import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ReservationProvider } from "./hooks/useReservation";
import { I18nProvider } from "./utils/i18n";
import RequireAuth from "./components/RequireAuth";
import BottomNav from "./components/BottomNav";
import Login from "./pages/eleve/Login";
import Accueil from "./pages/eleve/Accueil";
import Profil from "./pages/eleve/Profil";
import Reservation from "./pages/eleve/Reservation";
import Quantite from "./pages/eleve/Quantite";
import Horaire from "./pages/eleve/Horaire";
import Place from "./pages/eleve/Place";

function Layout({ children }) {
  const { pathname } = useLocation();
  const sansNav =
    pathname === "/login" || pathname === "/" || pathname === "/profil" || pathname.startsWith("/reservation");
  return (
    <>
      {children}
      {!sansNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ReservationProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ReservationProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
