/**
 * Centralized API client configuration
 * Uses environment variable VITE_API_URL for production, falls back to localhost for development
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Constructs full API URL from a given path
 * @param path - API endpoint path (e.g., "/api/auth/login")
 * @returns Full URL to the API endpoint
 */
export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

/**
 * Get the base API URL (useful for WebSocket connections, etc.)
 */
export function getBaseApiUrl(): string {
  return API_URL;
}
