import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  showTextures: boolean;
  toggleTextures: () => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved as Theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [showTextures, setShowTextures] = useState<boolean>(() => {
    const saved = localStorage.getItem('showTextures');
    return saved === null ? true : saved === 'true';
  });

  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    const saved = localStorage.getItem('reduceMotion');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    if (reduceMotion) root.classList.add('reduce-motion'); else root.classList.remove('reduce-motion');
    localStorage.setItem('theme', theme);
    localStorage.setItem('showTextures', String(showTextures));
    localStorage.setItem('reduceMotion', String(reduceMotion));
  }, [theme, showTextures, reduceMotion]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleTextures = () => setShowTextures(prev => !prev);
  const toggleReduceMotion = () => setReduceMotion(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, showTextures, toggleTextures, reduceMotion, toggleReduceMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
