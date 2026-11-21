import axios from "axios";

const api = axios.create({
  // Même hôte que la page : localhost sur le PC, IP du PC depuis un téléphone.
  baseURL: `${window.location.protocol}//${window.location.hostname}:8000`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.startsWith("/auth/")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = window.location.pathname === "/" || window.location.pathname.startsWith("/reservation") || window.location.pathname === "/profil" ? "/login" : "/pro";
    }
    return Promise.reject(err);
  },
);

export default api;
