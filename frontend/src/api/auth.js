import axios from "axios";

// 1. Fallback auf die NEUE Domain ändern
// 2. Robustere URL-Logik: Wir stellen sicher, dass '/api' am Ende steht
const envUrl = import.meta.env.VITE_API_URL || "https://api.fecg-lahr-app.de";
const API_URL = envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;

export const login = async (username, password) => {
  // WICHTIG: Prüfen, ob dein Backend den Slash am Ende braucht (/auth vs /auth/)
  // Django benötigt meistens den Trailing Slash.
  const response = await axios.post(
    `${API_URL}/auth/`,
    { username, password },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (response.data.token) {
    localStorage.setItem("adminToken", response.data.token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("adminToken");
};

export const getToken = () => {
  return localStorage.getItem("adminToken");
};

export const isAuthenticated = () => {
  return !!getToken();
};
