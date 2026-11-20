import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { size, spacing } from '../lib/theme';
import { Screen } from './screen';
export function AuthScreen({ children, contentStyle }: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  return <Screen edges={['top', 'bottom', 'left', 'right']} keyboard>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1, justifyContent: 'center', alignSelf: 'center', width: '100%',
    maxWidth: size.contentMax, padding: spacing.space6, gap: spacing.space5,
  },
});
