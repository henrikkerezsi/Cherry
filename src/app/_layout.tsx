import { Stack, ThemeProvider } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { CherryThemeProvider, useAppTheme } from '../theme';
import { buildNavigationTheme } from '../theme/navigation';
import { DataProvider, useAppData } from '../data/DataProvider';

function ThemedContent() {
  const theme = useAppTheme();
  const navigationTheme = buildNavigationTheme(theme);

  return (
    <ThemeProvider value={navigationTheme}>
      <PaperProvider theme={theme}>
        <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="record"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen name="record/review" options={{ title: 'Review' }} />
          <Stack.Screen name="ai-provider" options={{ title: 'AI provider' }} />
          <Stack.Screen name="backup" options={{ title: 'Backup and restore' }} />
          <Stack.Screen name="tutorial" options={{ headerShown: false }} />
          <Stack.Screen name="whats-new" options={{ title: "What's new" }} />
          <Stack.Screen name="about" options={{ title: 'About' }} />
        </Stack>
      </PaperProvider>
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { settings } = useAppData();

  return (
    <CherryThemeProvider preference={settings.themeMode}>
      <ThemedContent />
    </CherryThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <DataProvider>
      <ThemedApp />
    </DataProvider>
  );
}
