// VITE_API_URL has historically been configured several different ways in
// local .env files: as the bare origin (http://host:port), as the origin
// plus /api (http://host:port/api), and occasionally with the version
// segment too (http://host:port/api/v1). Normalize all of them down to the
// bare origin so API_V1_URL is always exactly <origin>/api/v1 - never
// /api/api/v1 or /api/v1/api/v1.
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const API_ORIGIN = rawApiUrl
  .trim()
  .replace(/\/+$/, '') // trailing slashes
  .replace(/\/api\/v\d+$/i, '') // .../api/v1
  .replace(/\/api$/i, ''); // .../api

export const API_V1_URL = `${API_ORIGIN}/api/v1`;
export const STORAGE_URL = `${API_ORIGIN}/storage`;

// Dev-only diagnostic: makes a misconfigured VITE_API_URL obvious in the
// console instead of surfacing as a wall of confusing 404s.
if (import.meta.env.DEV) {
  console.info(
    `%c[apiConfig] VITE_API_URL=${JSON.stringify(import.meta.env.VITE_API_URL)} -> API_V1_URL=${API_V1_URL}`,
    'color: #8b5cf6; font-weight: bold;'
  );
}
