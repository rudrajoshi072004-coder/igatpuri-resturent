export function setAdminToken(accessToken) {
  localStorage.setItem("igatpuri_admin_access_token", accessToken);
}

export function clearAdminToken() {
  localStorage.removeItem("igatpuri_admin_access_token");
}

export function getAdminToken() {
  return localStorage.getItem("igatpuri_admin_access_token");
}

