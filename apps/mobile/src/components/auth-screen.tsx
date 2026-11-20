import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { size, spacing } from '../lib/theme';
import { Screen } from './screen';
export function AuthScreen({ children }: PropsWithChildren) {
  return <Screen edges={['top', 'bottom', 'left', 'right']} keyboard>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1, justifyContent: 'center', alignSelf: 'center', width: '100%',
    maxWidth: size.contentMax, padding: spacing.space6, gap: spacing.space5,
  },
});
