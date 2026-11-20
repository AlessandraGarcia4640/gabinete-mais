import { AppText } from './app-text';
import { ActivityIndicator, View } from 'react-native';
import { strings } from '../lib/strings';
import { createThemedStyles, useTheme } from '../providers/theme-provider';
import { Button } from './button';
export function LoadingState({ message = strings.feedback.loading }: { message?: string }) {
  const styles = useStyles();
  const theme = useTheme();
  return <View style={styles.state} accessibilityState={{ busy: true }}><ActivityIndicator color={theme.colors.brand} /><AppText variant="caption" accessibilityLiveRegion="polite" style={styles.description}>{message}</AppText></View>; }
export function EmptyState({ message }: { message: string }) {
  const styles = useStyles();
  return <View style={styles.state}><AppText variant="caption" style={styles.description}>{message}</AppText></View>; }
export function ErrorState({ retry, updating = false, message }: { retry: () => void; updating?: boolean; message?: string }) {
  const styles = useStyles();
  return <View style={styles.state}><AppText variant="caption" accessibilityRole="alert" style={styles.error}>{message ?? (updating ? strings.feedback.updatingError : strings.feedback.error)}</AppText><Button label={strings.feedback.retry} secondary onPress={retry} /></View>;
}
const useStyles = createThemedStyles((theme) => ({ state: { padding: 20, gap: 16, alignItems: 'center' }, description: { color: theme.colors.inkMuted }, error: { color: theme.colors.danger } }));
