import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'tarefas' };

export default function WorkLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
