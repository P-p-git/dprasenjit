import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getResolvedTheme = (mode) => {
  if (mode === 'system') return getSystemTheme();
  return mode;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('theme-mode') || 'light';
    } catch {
      return 'light';
    }
  });

  const [resolved, setResolved] = useState(() => getResolvedTheme(mode));

  useEffect(() => {
    const resolvedTheme = getResolvedTheme(mode);
    setResolved(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const r = getResolvedTheme('system');
      setResolved(r);
      document.documentElement.setAttribute('data-theme', r);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setTheme = useCallback((newMode) => {
    setMode(newMode);
    try {
      localStorage.setItem('theme-mode', newMode);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
