// Colour theme preference. "system" follows the operating system; "light" and "dark" are explicit choices.
// Kept free of React and the DOM so it can be unit-tested and reused by the pre-render script in index.html.
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

/** The theme actually shown for a preference, given whether the system currently prefers dark. */
export function resolveTheme(preference, systemDark) {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemDark ? 'dark' : 'light';
}

/** The quick toggle flips the visible theme and records it as an explicit choice. */
export function toggledPreference(preference, systemDark) {
  return resolveTheme(preference, systemDark) === 'dark' ? 'light' : 'dark';
}

export const themeColor = { light: '#244c3b', dark: '#151a17' };
