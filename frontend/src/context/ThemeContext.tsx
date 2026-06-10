import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextValue {
  dark: boolean;
  toggleDark: (v?: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'resqpet_dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]);

  const toggleDark = (v?: boolean) => setDark(prev => v ?? !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
