import { createContext, useContext, type PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { themes, type Theme } from '../lib/theme';

const ThemeContext = createContext(themes.light);
const AppFontsContext = createContext(false);

export function ThemeProvider({ children, fontsLoaded }: PropsWithChildren<{ fontsLoaded: boolean }>) {
  const colorScheme = useColorScheme();
  return (
    <ThemeContext.Provider value={themes[colorScheme ?? 'light']}>
      <AppFontsContext.Provider value={fontsLoaded}>{children}</AppFontsContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useAppFonts(): boolean {
  return useContext(AppFontsContext);
}

export function createThemedStyles<Styles extends StyleSheet.NamedStyles<Styles>>(
  create: (theme: Theme) => Styles,
) {
  const styles = {
    light: StyleSheet.create(create(themes.light)),
    dark: StyleSheet.create(create(themes.dark)),
  };
  return function useStyles(): Styles {
    return styles[useTheme().name];
  };
}
