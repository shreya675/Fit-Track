import { useCallback, useEffect, useState } from 'react';
import { readPreference, resolveTheme, themeColor, toggledPreference, writePreference } from './theme';

const query = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

/**
 * Applies the colour theme to <html data-theme> and keeps it in step with the system setting.
 * The preference is a device setting, like a rest-timer length: it lives in this browser, not the account,
 * so switching devices never surprises anyone with a theme they chose somewhere else.
 */
export default function useTheme() {
  const [preference, setPreferenceState] = useState(() => readPreference(typeof localStorage === 'undefined' ? null : localStorage));
  const [systemDark, setSystemDark] = useState(() => Boolean(query()?.matches));
  useEffect(() => {
    const media = query();
    if (!media) return;
    const update = event => setSystemDark(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const theme = resolveTheme(preference, systemDark);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor[theme]);
  }, [theme]);
  const setPreference = useCallback(next => { setPreferenceState(next); writePreference(localStorage, next); }, []);
  const toggle = useCallback(() => setPreference(toggledPreference(preference, systemDark)), [preference, systemDark, setPreference]);
  return { preference, theme, setPreference, toggle };
}
