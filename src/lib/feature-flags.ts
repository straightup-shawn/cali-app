const PROGRESSION_STORAGE_KEY = 'isometrix:progression_enabled';

export function isProgressionEnabled(): boolean {
  if (import.meta.env.VITE_PROGRESSION_ENABLED === 'true') return true;
  if (import.meta.env.VITE_PROGRESSION_ENABLED === 'false') return false;
  return localStorage.getItem(PROGRESSION_STORAGE_KEY) === 'true';
}

export function setProgressionEnabled(enabled: boolean): void {
  localStorage.setItem(PROGRESSION_STORAGE_KEY, String(enabled));
}
