import type { MantineColor } from '@mantine/core';
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'primaryColor';
const DEFAULT_COLOR: MantineColor = 'teal';

interface PrimaryColorContextValue {
  primaryColor: MantineColor;
  setPrimaryColor: (color: MantineColor) => void;
}

const PrimaryColorContext = createContext<PrimaryColorContextValue>({
  primaryColor: DEFAULT_COLOR,
  setPrimaryColor: () => {},
});

export const usePrimaryColor = () => useContext(PrimaryColorContext);

export const PrimaryColorProvider = ({ children }: { children: ReactNode }) => {
  const [primaryColor, setPrimaryColorState] = useState<MantineColor>(
    () => (localStorage.getItem(STORAGE_KEY) as MantineColor) ?? DEFAULT_COLOR,
  );

  const setPrimaryColor = (color: MantineColor) => {
    localStorage.setItem(STORAGE_KEY, color);
    setPrimaryColorState(color);
  };

  return (
    <PrimaryColorContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </PrimaryColorContext.Provider>
  );
};
