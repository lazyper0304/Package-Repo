import { createContext, useContext } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppContextType {
  isAdmin: boolean;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { AppContext };
export type { ThemeMode };
