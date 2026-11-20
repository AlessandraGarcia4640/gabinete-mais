import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { createThemedStyles } from '../providers/theme-provider';
export function Screen({ children, edges = ['bottom'], keyboard = false, modal = false, style }: PropsWithChildren<{ edges?: Edge[]; keyboard?: boolean; modal?: boolean; style?: StyleProp<ViewStyle> }>) {
  const styles = useStyles();
  return <SafeAreaView style={[styles.screen, style]} edges={edges} accessibilityViewIsModal={modal}>{keyboard ? <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>{children}</KeyboardAvoidingView> : children}</SafeAreaView>;
}
const useStyles = createThemedStyles((theme) => ({ screen: { flex: 1, backgroundColor: theme.colors.bg } }));
