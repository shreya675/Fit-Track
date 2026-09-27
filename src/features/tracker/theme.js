// Theme preference: system | light | dark
export const THEME_KEY = 'fittrack.theme';
export const themeOptions = ['system', 'light', 'dark'];

export function readPreference(storage) {
  try {
    const value = storage?.getItem(THEME_KEY);
    return themeOptions.includes(value) ? value : 'system';
  } catch { return 'system'; }
}

export function writePreference(storage, preference) {
  try {
    if (preference === 'system') storage.removeItem(THEME_KEY);
    else storage.setItem(THEME_KEY, preference);
    return true;
  } catch { return false; }
}

export function resolveTheme(preference, systemDark) {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemDark ? 'dark' : 'light';
}

export function toggledPreference(preference, systemDark) {
  return resolveTheme(preference, systemDark) === 'dark' ? 'light' : 'dark';
}

export const themeColor = { light: '#244c3b', dark: '#151a17' };
