import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const u = JSON.parse(stored);
    return { role: "eleve", ...u };
  });

  const ouvrirSession = useCallback((data) => {
    localStorage.setItem("token", data.access_token);
    const u = { nom: data.nom, matricule: data.matricule, role: data.role || "eleve" };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    return data;
  }, []);

  const login = useCallback(
    async (matricule, pin) =>
      ouvrirSession((await api.post("/auth/login", { matricule, pin })).data),
    [ouvrirSession],
  );

  const choisirPin = useCallback(
    async (matricule, nouveau_pin) =>
      ouvrirSession((await api.post("/auth/pin", { matricule, nouveau_pin })).data),
    [ouvrirSession],
  );

  const loginUser = useCallback(
    async (identifiant, mot_de_passe) =>
      ouvrirSession((await api.post("/auth/user/login", { identifiant, mot_de_passe })).data),
    [ouvrirSession],
  );

  const inscrireParent = useCallback(
    async (nom, identifiant, mot_de_passe) =>
      ouvrirSession(
        (await api.post("/auth/parent/register", { nom, identifiant, mot_de_passe })).data,
      ),
    [ouvrirSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, choisirPin, loginUser, inscrireParent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
