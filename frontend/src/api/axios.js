import axios from "axios";
import { getToken } from "./auth";

// Wir definieren die Base URL einmal sauber
// Entweder kommt sie aus Docker (VITE_API_URL) oder wir nehmen den Fallback.
// WICHTIG: Wir hängen '/api' an, falls es in der Variable fehlt!
const envUrl = import.meta.env.VITE_API_URL || "https://fecg-lahr-app.de";
const baseURL = envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;

console.log("API Base URL:", baseURL);

const axiosInstance = axios.create({
  baseURL: baseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ... der Rest deines Codes (Response Interceptor etc.) bleibt gleich ...
// ...
// ...

export default axiosInstance;
