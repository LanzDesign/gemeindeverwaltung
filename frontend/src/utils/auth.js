// Hilfsfunktionen für Berechtigungsprüfungen

export const isJugendleiter = () => {
  return localStorage.getItem("isJugendleiter") === "true";
};

export const isGemeindeallteste = () => {
  return localStorage.getItem("isGemeindeallteste") === "true";
};

export const getUserGroups = () => {
  const groups = localStorage.getItem("userGroups");
  return groups ? JSON.parse(groups) : [];
};

export const hasGroup = (groupName) => {
  const groups = getUserGroups();
  return groups.includes(groupName);
};

export const canAccessJugendverwaltung = () => {
  return isJugendleiter() || isGemeindeallteste();
};
