export type ThemeMode = 'luna' | 'dark' | 'light' | 'system';

export const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  const body = document.body;
  localStorage.setItem('ilms_pref_theme', theme);

  let activeMode: 'dark' | 'light' | 'luna' = 'luna';

  if (theme === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    activeMode = prefersDark ? 'dark' : 'luna';
  } else {
    activeMode = theme;
  }

  root.setAttribute('data-theme', activeMode);
  if (body) body.setAttribute('data-theme', activeMode);

  if (activeMode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('theme-light');
    root.classList.remove('theme-luna');
    root.style.setProperty('--bg-main', '#140E1F');
    root.style.setProperty('--card-bg', '#1F182C');
    root.style.setProperty('--card-secondary', '#2B213D');
    root.style.setProperty('--text-primary', '#F8F6FC');
    root.style.setProperty('--text-secondary', '#C4B9D8');
    root.style.setProperty('--border-color', '#3B2D52');
    root.style.setProperty('--primary-cyan', '#BCA0F5');
  } else if (activeMode === 'light') {
    root.classList.remove('dark');
    root.classList.add('theme-light');
    root.classList.remove('theme-luna');
    root.style.setProperty('--bg-main', '#F8FAFC');
    root.style.setProperty('--card-bg', '#FFFFFF');
    root.style.setProperty('--card-secondary', '#F1F5F9');
    root.style.setProperty('--text-primary', '#0F172A');
    root.style.setProperty('--text-secondary', '#475569');
    root.style.setProperty('--border-color', '#E2E8F0');
    root.style.setProperty('--primary-cyan', '#2563EB');
  } else {
    // Default: Luna Pastel Warm Cream Theme
    root.classList.remove('dark');
    root.classList.remove('theme-light');
    root.classList.add('theme-luna');
    root.style.setProperty('--bg-main', '#FFF8F2');
    root.style.setProperty('--card-bg', '#FFFFFF');
    root.style.setProperty('--card-secondary', '#F0E9FF');
    root.style.setProperty('--text-primary', '#332B40');
    root.style.setProperty('--text-secondary', '#71667D');
    root.style.setProperty('--border-color', '#E9DDF1');
    root.style.setProperty('--primary-cyan', '#8961D8');
  }

  window.dispatchEvent(new CustomEvent('ilms:theme-change', { detail: activeMode }));
};

export const getSavedTheme = (): ThemeMode => {
  const saved = localStorage.getItem('ilms_pref_theme') as ThemeMode;
  if (saved === 'dark' || saved === 'light' || saved === 'system' || saved === 'luna') {
    return saved;
  }
  return 'luna';
};
