import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, toggleTheme as toggleThemeAction } from '../store/slices/uiSlice';

/** Applies the theme class to <html> and exposes a toggle. */
export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => dispatch(toggleThemeAction()),
    setTheme: (value) => dispatch(setTheme(value)),
  };
}
