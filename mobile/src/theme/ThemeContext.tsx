import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ColorPalette, TimePeriod, getTimePeriod, getColors } from './colors';
import { typography, spacing, borderRadius } from './typography';

export interface Theme {
  colors: ColorPalette;
  timePeriod: TimePeriod;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

interface ThemeContextValue {
  theme: Theme;
  timePeriod: TimePeriod;
  forceTimePeriod: (period: TimePeriod | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [forcedPeriod, setForcedPeriod] = useState<TimePeriod | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>(getTimePeriod());

  useEffect(() => {
    // Check time every minute to update theme
    const interval = setInterval(() => {
      const newPeriod = getTimePeriod();
      if (newPeriod !== currentPeriod) {
        setCurrentPeriod(newPeriod);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentPeriod]);

  const activePeriod = forcedPeriod || currentPeriod;

  const theme: Theme = {
    colors: getColors(
      forcedPeriod
        ? periodToDate(forcedPeriod)
        : undefined
    ),
    timePeriod: activePeriod,
    typography,
    spacing,
    borderRadius,
  };

  const forceTimePeriod = useCallback((period: TimePeriod | null) => {
    setForcedPeriod(period);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, timePeriod: activePeriod, forceTimePeriod }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper to create a representative date for a forced time period
function periodToDate(period: TimePeriod): Date {
  const date = new Date();
  switch (period) {
    case 'lateNight': date.setHours(3, 0); break;
    case 'morning': date.setHours(9, 0); break;
    case 'afternoon': date.setHours(14, 0); break;
    case 'goldenHour': date.setHours(18, 0); break;
    case 'evening': date.setHours(22, 0); break;
  }
  return date;
}
