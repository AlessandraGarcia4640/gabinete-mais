import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { strings } from '../lib/strings';
import { spacing } from '../lib/theme';
import { AppText } from './app-text';
import { Banner } from './banner';
import { Button } from './button';
import { FeedbackSymbol } from './feedback-symbol';
import type { IconName } from './icon';
import { Skeleton } from './skeleton';

interface MessageProps {
  message: string;
  description?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; icon?: IconName };
  actions?: ReactNode;
}

function StateMessage({ message, description, icon = 'inbox', action, actions, error }: MessageProps & { error?: boolean }) {
  return (
    <View style={styles.state}>
      <FeedbackSymbol icon={icon} danger={error} />
      <AppText
        variant="heading"
        accessibilityRole={error ? 'alert' : 'header'}
        accessibilityLiveRegion={error ? 'polite' : undefined}
        style={styles.center}
      >
        {message}
      </AppText>
      {!!description && <AppText variant="label" color="inkMuted" style={styles.center}>{description}</AppText>}
      {!!action && <Button {...action} variant={error ? 'secondary' : 'primary'} />}
      {actions}
    </View>
  );
}

export function LoadingState({ message = strings.feedback.loading, count = 1, style }: {
  message?: string; count?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityState={{ busy: true }} style={[styles.loading, style]}>
      <AppText variant="caption" color="inkMuted" accessibilityLiveRegion="polite">{message}</AppText>
      {Array.from({ length: count }, (_, index) => <Skeleton key={index} />)}
    </View>
  );
}

export function EmptyState(props: MessageProps) {
  return <StateMessage {...props} />;
}

export function ErrorState({ retry, updating = false, message }: { retry: () => void; updating?: boolean; message?: string }) {
  const retryAction: NonNullable<MessageProps['action']> = {
    label: strings.feedback.retry, onPress: retry, icon: 'refresh-cw',
  };
  if (updating) {
    return (
      <View style={styles.loading}>
        <Banner tone="danger" message={message ?? strings.feedback.updatingError} />
        <Button {...retryAction} variant="secondary" />
      </View>
    );
  }
  return (
    <StateMessage
      error icon="alert-circle" message={message ?? strings.feedback.error}
      description={message ? undefined : strings.feedback.errorHelp} action={retryAction}
    />
  );
}

const styles = StyleSheet.create({
  state: {
    alignItems: 'center', paddingVertical: spacing.space12, paddingHorizontal: spacing.space6, gap: spacing.space3,
  },
  loading: { padding: spacing.space4, gap: spacing.space3 },
  center: { textAlign: 'center' },
});
