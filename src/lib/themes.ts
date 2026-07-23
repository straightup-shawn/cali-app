export const THEMES = {
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentDark: '#4f46e5',
    accentGlow: 'rgba(99, 102, 241, 0.2)',
    accentGlowHover: 'rgba(99, 102, 241, 0.4)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    accent: '#10b981',
    accentLight: '#34d399',
    accentDark: '#059669',
    accentGlow: 'rgba(16, 185, 129, 0.2)',
    accentGlowHover: 'rgba(16, 185, 129, 0.4)',
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    accent: '#f43f5e',
    accentLight: '#fb7185',
    accentDark: '#e11d48',
    accentGlow: 'rgba(244, 63, 94, 0.2)',
    accentGlowHover: 'rgba(244, 63, 94, 0.4)',
  },
  amber: {
    id: 'amber',
    name: 'Amber',
    accent: '#f59e0b',
    accentLight: '#fbbf24',
    accentDark: '#d97706',
    accentGlow: 'rgba(245, 158, 11, 0.2)',
    accentGlowHover: 'rgba(245, 158, 11, 0.4)',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyan',
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    accentDark: '#0891b2',
    accentGlow: 'rgba(6, 182, 212, 0.2)',
    accentGlowHover: 'rgba(6, 182, 212, 0.4)',
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    accent: '#8b5cf6',
    accentLight: '#a78bfa',
    accentDark: '#7c3aed',
    accentGlow: 'rgba(139, 92, 246, 0.2)',
    accentGlowHover: 'rgba(139, 92, 246, 0.4)',
  },
} as const;

export type ThemeId = keyof typeof THEMES;
export type Theme = (typeof THEMES)[ThemeId];

const STORAGE_KEY = 'calisthenics-log:theme';

export function getStoredTheme(): ThemeId {
  return (localStorage.getItem(STORAGE_KEY) as ThemeId) ?? 'indigo';
}

export function setStoredTheme(id: ThemeId): void {
  localStorage.setItem(STORAGE_KEY, id);
  applyTheme(id);
}

export function applyTheme(id: ThemeId): void {
  const theme = THEMES[id];
  const root = document.documentElement;
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-light', theme.accentLight);
  root.style.setProperty('--accent-dark', theme.accentDark);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  root.style.setProperty('--accent-glow-hover', theme.accentGlowHover);
}
