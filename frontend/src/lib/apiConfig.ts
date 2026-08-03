// VITE_API_URL has historically been configured both ways in different
// local .env files - as the bare origin (http://host:port) and as the
// origin plus /api (http://host:port/api). Strip a trailing /api so
// API_V1_URL is always .../api/v1, never .../api/api/v1.
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const API_ORIGIN = rawApiUrl.replace(/\/api\/?$/, '');
export const API_V1_URL = `${API_ORIGIN}/api/v1`;
export const STORAGE_URL = `${API_ORIGIN}/storage`;
