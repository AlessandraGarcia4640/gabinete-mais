import { AppText } from '../../components/app-text';
import { Card } from '../../components/card';
import { useMutation } from '@tanstack/react-query';
import { AuthScreen } from '../../components/auth-screen';
import { Button } from '../../components/button';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
export function SessionScreen() {
  const styles = useStyles();
  const { user } = useSession(); const manager = useSessionManager();
  const logout = useMutation({ mutationFn: () => manager.logout(), retry: false });
  if (!user) return null;
  return <AuthScreen><AppText variant="titleLg" style={styles.brand}>{strings.brand}</AppText><Card style={styles.profile}>
    <AppText variant="caption" style={styles.description}>{strings.session.welcome}</AppText><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{user.name}</AppText>
    <AppText variant="caption" style={styles.description}>{strings.session.description}</AppText><AppText variant="bodyStrong" style={styles.label}>{strings.session.profile}</AppText>
    <AppText variant="heading" style={styles.role}>{strings.session.roles[user.role]}</AppText>
  </Card><Button label={logout.isPending ? strings.session.leaving : strings.session.logout} variant="secondary" loading={logout.isPending} onPress={() => logout.mutate()} /></AuthScreen>;
}
const useStyles = createThemedStyles((theme) => ({ brand: { color: theme.colors.brandText }, profile: { padding: 24, gap: 16, marginBottom: 0 },
  title: { color: theme.colors.ink }, description: { color: theme.colors.inkMuted }, label: { color: theme.colors.inkMuted }, role: { color: theme.colors.brandText } }));
