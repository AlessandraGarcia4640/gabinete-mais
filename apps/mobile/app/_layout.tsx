import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { ConnectionGate } from '../src/features/auth/connection-gate';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '../src/providers/query-provider';
import { SessionProvider, useSession } from '../src/providers/session-provider';
import { SessionGate } from '../src/features/auth/session-gate';
import { strings } from '../src/lib/strings';
import { fontFamily } from '../src/lib/theme';
import { ThemeProvider, useTheme } from '../src/providers/theme-provider';

const appFonts = {
  [fontFamily.sans400]: IBMPlexSans_400Regular,
  [fontFamily.sans500]: IBMPlexSans_500Medium,
  [fontFamily.sans600]: IBMPlexSans_600SemiBold,
  [fontFamily.mono400]: IBMPlexMono_400Regular,
  [fontFamily.mono500]: IBMPlexMono_500Medium,
};

void SplashScreen.preventAutoHideAsync();

function ThemedNavigation({ children }: PropsWithChildren) {
  const { name, colors } = useTheme();
  const dark = name === 'dark';
  const navigationTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      primary: colors.brandText,
      background: colors.bg,
      card: colors.surface,
      text: colors.ink,
      border: colors.border,
      notification: colors.danger,
    },
  };
  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
      <StatusBar style={dark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

function SessionRoutes() {
  const session = useSession();
  return <SessionGate><Stack screenOptions={{ headerShown: false }}>
    <Stack.Protected guard={session.status === 'anonymous'}><Stack.Screen name="login" options={{ title: strings.auth.title }} /></Stack.Protected>
    <Stack.Protected guard={session.status === 'authenticated'}><Stack.Screen name="(tabs)" options={{ title: strings.session.title }} /></Stack.Protected>
  </Stack></SessionGate>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const ready = fontsLoaded || Boolean(fontError);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <ThemeProvider fontsLoaded={fontsLoaded}>
      <ThemedNavigation>
        <QueryProvider>
          <SafeAreaProvider>
            <ConnectionGate>
              <SessionProvider><SessionRoutes /></SessionProvider>
            </ConnectionGate>
          </SafeAreaProvider>
        </QueryProvider>
      </ThemedNavigation>
    </ThemeProvider>
  );
}
