const AUTH_KEY = "hj_authenticated";

export function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function checkPassword(input) {
  return input === import.meta.env.VITE_APP_PASSWORD;
}

export function markAuthenticated() {
  sessionStorage.setItem(AUTH_KEY, "true");
}
