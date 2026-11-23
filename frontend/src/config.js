const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '127.0.0.1';
const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : `http://${hostname}:8000`;

// Where the LMS Engine preview build is hosted (e.g. https://preview.example.com/index.html). Empty = the LMS preview is off.
export const LMS_PREVIEW_URL = import.meta.env.VITE_LMS_PREVIEW_URL || '';

export const API_BASE_URL =import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? `http://${hostname}:8000` : origin);
