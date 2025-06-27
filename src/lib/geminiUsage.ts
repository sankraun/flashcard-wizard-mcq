// Simple Gemini API usage tracker using localStorage
// This is a client-only solution. For production, use a backend or database.

const USAGE_KEY = 'gemini_api_usage';
const LIMIT_KEY = 'gemini_api_limit';

export function getGeminiUsage() {
  const used = parseInt(localStorage.getItem(USAGE_KEY) || '0', 10);
  const limit = parseInt(localStorage.getItem(LIMIT_KEY) || '1000000', 10); // Default limit
  return { used, limit, left: Math.max(0, limit - used) };
}

export function incrementGeminiUsage(tokens: number) {
  const current = parseInt(localStorage.getItem(USAGE_KEY) || '0', 10);
  localStorage.setItem(USAGE_KEY, String(current + tokens));
}

export function setGeminiLimit(limit: number) {
  localStorage.setItem(LIMIT_KEY, String(limit));
}

export function resetGeminiUsage() {
  localStorage.setItem(USAGE_KEY, '0');
}
