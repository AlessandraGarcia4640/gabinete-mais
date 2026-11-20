import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'gabinete' };

export default function CabinetLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
