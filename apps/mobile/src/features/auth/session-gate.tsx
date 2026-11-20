import { AppText } from '../../components/app-text';
import type { PropsWithChildren } from 'react';
import { ActivityIndicator } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { AuthScreen } from '../../components/auth-screen';
import { Button } from '../../components/button';
import { strings } from '../../lib/strings';
import { createThemedStyles, useTheme } from '../../providers/theme-provider';
import { useSession, useSessionManager } from '../../providers/session-provider';
export function SessionGate({ children }: PropsWithChildren) {
  const styles = useStyles();
  const theme = useTheme();
  const session = useSession(); const manager = useSessionManager();
  const retry = useMutation({ mutationFn: () => manager.restore(), retry: false });
  const exit = useMutation({ mutationFn: () => manager.logout(), retry: false });
  if (session.status === 'initializing') return <AuthScreen><ActivityIndicator color={theme.colors.brand} size="large" /><AppText variant="body" style={styles.message}>{strings.auth.restoring}</AppText></AuthScreen>;
  if (session.status === 'recovery') return <AuthScreen><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{strings.auth.recoveryTitle}</AppText>
    <AppText variant="body" accessibilityRole="alert" style={styles.message}>{session.errorCode ? strings.auth[session.errorCode] : strings.auth.unexpected}</AppText>
    <Button label={strings.auth.retry} onPress={() => retry.mutate()} loading={retry.isPending} />
    <Button label={strings.auth.returnToLogin} secondary onPress={() => exit.mutate()} loading={exit.isPending} />
  </AuthScreen>;
  return children;
}
const useStyles = createThemedStyles((theme) => ({ message: { textAlign: 'center', color: theme.colors.inkMuted }, title: { color: theme.colors.ink } }));
