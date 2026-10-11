import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CustomTabBar } from '../../components/custom-tab-bar';
import { MicFab } from '../../components/mic-fab';
import { useAppTheme } from '../../theme';

export default function TabsLayout() {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Overview', headerShown: false }} />
        <Tabs.Screen name="log" options={{ title: 'Log' }} />
        <Tabs.Screen name="equipment" options={{ title: 'Equipment' }} />
        <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
      <MicFab bottomOffset={64} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
