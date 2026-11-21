import type { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { AppText, AuthScreen, Button } from '../../components';
import { FeedbackSymbol } from '../../components/feedback-symbol';
import { strings } from '../../lib/strings';
import { dimensions, spacing } from '../../lib/theme';
import { BrandMark } from '../../navigation/brand-mark';
import { useTheme } from '../../providers/theme-provider';
import { useSession, useSessionManager } from '../../providers/session-provider';
export function SessionGate({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const session = useSession(); const manager = useSessionManager();
  const retry = useMutation({ mutationFn: () => manager.restore(), retry: false });
  const exit = useMutation({ mutationFn: () => manager.logout(), retry: false });
  const restoring = session.status === 'initializing';
  if (!restoring && session.status !== 'recovery') return children;

  const reason = session.errorCode ? strings.auth[session.errorCode] : strings.auth.unexpected;
  return (
    <AuthScreen contentStyle={styles.page}>
      <BrandMark large />
      {restoring ? (
        <View style={styles.feedback} accessibilityState={{ busy: true }}>
          <ActivityIndicator color={colors.brand} size="large" />
          <AppText variant="body" color="inkMuted" accessibilityLiveRegion="polite" style={styles.center}>
            {strings.auth.restoring}
          </AppText>
        </View>
      ) : (
        <View style={styles.feedback}>
          <FeedbackSymbol icon="alert-circle" danger />
          <AppText variant="heading" accessibilityRole="header" style={styles.center}>
            {strings.auth.recoveryTitle}
          </AppText>
          <AppText variant="label" color="inkMuted" accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.reason}>
            {reason}
          </AppText>
          <View style={styles.actions}>
            <Button label={strings.auth.retry} icon="refresh-cw" onPress={() => retry.mutate()} loading={retry.isPending} disabled={exit.isPending} />
            <Button label={strings.auth.returnToLogin} variant="secondary" onPress={() => exit.mutate()} loading={exit.isPending} disabled={retry.isPending} />
          </View>
        </View>
      )}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: spacing.space16, paddingBottom: spacing.space8, gap: spacing.space8 },
  feedback: {
    alignItems: 'center', paddingVertical: spacing.space12, paddingHorizontal: spacing.space6, gap: spacing.space3,
  },
  reason: { maxWidth: dimensions.recoveryMessageMax, textAlign: 'center' },
  center: { textAlign: 'center' },
  actions: { width: '100%', gap: spacing.space2, marginTop: spacing.space3 },
});
