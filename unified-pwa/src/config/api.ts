const rawApiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

export const API_BASE = `${rawApiBase}/api`;
