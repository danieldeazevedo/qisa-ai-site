import { useState, useEffect } from 'react';

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  gradients: {
    chat: string;
    hero: string;
    background: string;
  };
}

const DEFAULT_THEMES: CustomTheme[] = [
  {
    id: 'default',
    name: 'Padrão',
    colors: {
      primary: '262.1 83.3% 57.8%',
      secondary: '210 40% 98%',
      accent: '210 40% 98%',
      background: '0 0% 100%',
      surface: '210 40% 98%',
      text: '222.2 84% 4.9%',
      muted: '210 40% 98%'
    },
    gradients: {
      chat: 'from-blue-500 via-purple-500 to-pink-500',
      hero: 'from-primary to-secondary',
      background: 'from-blue-50 via-purple-50 to-pink-50'
    }
  },
  {
    id: 'ocean',
    name: 'Oceano',
    colors: {
      primary: '195 100% 50%',
      secondary: '220 100% 70%',
      accent: '180 100% 60%',
      background: '210 100% 99%',
      surface: '210 50% 95%',
      text: '220 100% 10%',
      muted: '210 30% 90%'
    },
    gradients: {
      chat: 'from-cyan-500 via-blue-500 to-indigo-500',
      hero: 'from-cyan-400 to-blue-600',
      background: 'from-cyan-50 via-blue-50 to-indigo-50'
    }
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    colors: {
      primary: '15 100% 60%',
      secondary: '45 100% 70%',
      accent: '30 100% 65%',
      background: '30 100% 99%',
      surface: '30 50% 95%',
      text: '15 80% 10%',
      muted: '30 30% 90%'
    },
    gradients: {
      chat: 'from-orange-500 via-red-500 to-pink-500',
      hero: 'from-orange-400 to-red-600',
      background: 'from-orange-50 via-red-50 to-pink-50'
    }
  },
  {
    id: 'forest',
    name: 'Floresta',
    colors: {
      primary: '120 60% 45%',
      secondary: '100 40% 60%',
      accent: '140 50% 55%',
      background: '120 30% 98%',
      surface: '120 20% 95%',
      text: '120 80% 10%',
      muted: '120 15% 90%'
    },
    gradients: {
      chat: 'from-green-500 via-emerald-500 to-teal-500',
      hero: 'from-green-400 to-emerald-600',
      background: 'from-green-50 via-emerald-50 to-teal-50'
    }
  },
  {
    id: 'lavender',
    name: 'Lavanda',
    colors: {
      primary: '270 60% 65%',
      secondary: '290 50% 75%',
      accent: '250 60% 70%',
      background: '270 30% 98%',
      surface: '270 20% 95%',
      text: '270 80% 15%',
      muted: '270 15% 90%'
    },
    gradients: {
      chat: 'from-purple-500 via-violet-500 to-indigo-500',
      hero: 'from-purple-400 to-violet-600',
      background: 'from-purple-50 via-violet-50 to-indigo-50'
    }
  },
  {
    id: 'midnight',
    name: 'Meia-Noite',
    colors: {
      primary: '230 100% 70%',
      secondary: '250 80% 60%',
      accent: '200 100% 65%',
      background: '230 20% 8%',
      surface: '230 15% 12%',
      text: '230 20% 95%',
      muted: '230 10% 25%'
    },
    gradients: {
      chat: 'from-blue-600 via-purple-600 to-indigo-600',
      hero: 'from-blue-500 to-purple-700',
      background: 'from-slate-900 via-blue-900 to-purple-900'
    }
  }
];

export function useThemeCustomization() {
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(DEFAULT_THEMES);
  const [currentThemeId, setCurrentThemeId] = useState<string>('default');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qisa-custom-themes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomThemes([...DEFAULT_THEMES, ...parsed]);
      } catch (error) {
        console.error('Error loading custom themes:', error);
      }
    }

    const savedTheme = localStorage.getItem('qisa-current-theme');
    if (savedTheme) {
      setCurrentThemeId(savedTheme);
    }

    const savedDarkMode = localStorage.getItem('qisa-dark-mode');
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    const currentTheme = customThemes.find(theme => theme.id === currentThemeId);
    if (!currentTheme) return;

    const root = document.documentElement;
    
    // Apply colors
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply to body classes for gradients
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentThemeId}`);

    // Apply dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentThemeId, customThemes, isDarkMode]);

  const saveTheme = (theme: CustomTheme) => {
    const userThemes = customThemes.filter(t => !DEFAULT_THEMES.find(dt => dt.id === t.id));
    const updatedUserThemes = [...userThemes.filter(t => t.id !== theme.id), theme];
    
    setCustomThemes([...DEFAULT_THEMES, ...updatedUserThemes]);
    localStorage.setItem('qisa-custom-themes', JSON.stringify(updatedUserThemes));
  };

  const deleteTheme = (themeId: string) => {
    if (DEFAULT_THEMES.find(t => t.id === themeId)) return; // Can't delete default themes
    
    const userThemes = customThemes.filter(t => !DEFAULT_THEMES.find(dt => dt.id === t.id) && t.id !== themeId);
    setCustomThemes([...DEFAULT_THEMES, ...userThemes]);
    localStorage.setItem('qisa-custom-themes', JSON.stringify(userThemes));
    
    if (currentThemeId === themeId) {
      setCurrentTheme('default');
    }
  };

  const setCurrentTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    localStorage.setItem('qisa-current-theme', themeId);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('qisa-dark-mode', newDarkMode.toString());
  };

  const getCurrentTheme = () => {
    return customThemes.find(theme => theme.id === currentThemeId) || DEFAULT_THEMES[0];
  };

  const getThemeGradients = () => {
    const currentTheme = getCurrentTheme();
    return currentTheme.gradients;
  };

  return {
    customThemes,
    currentThemeId,
    isDarkMode,
    getCurrentTheme,
    getThemeGradients,
    setCurrentTheme,
    toggleDarkMode,
    saveTheme,
    deleteTheme
  };
}