import { ScrollView, StyleSheet, View } from 'react-native';
import { radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Banner } from './banner';
import { Button } from './button';
import { Icon } from './icon';
import { Overlay, type OverlayVisibility } from './overlay';

interface DialogProps extends OverlayVisibility {
  message: string;
  confirmLabel: string;
  dismissLabel: string;
  onConfirm: () => void;
  busy?: boolean;
  intent?: 'danger' | 'primary';
  error?: string;
}

export function Dialog({
  message, confirmLabel, dismissLabel, onConfirm, onDismiss, busy = false, intent = 'danger', error, ...visibility
}: DialogProps) {
  const { colors } = useTheme();
  const destructive = intent === 'danger';
  return (
    <Overlay
      {...visibility}
      placement="dialog"
      onDismiss={() => { if (!busy) onDismiss(); }}
      headerIcon={
        <View style={[styles.symbol, { backgroundColor: destructive ? colors.dangerSoft : colors.infoSoft }]}>
          <Icon name={destructive ? 'alert-triangle' : 'info'} color={destructive ? 'danger' : 'info'} />
        </View>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <AppText variant="body" color="inkMuted">{message}</AppText>
        {!!error && <Banner tone="danger" message={error} />}
        <View style={styles.actions}>
          <Button label={confirmLabel} onPress={onConfirm} variant={intent} loading={busy} />
          <Button label={dismissLabel} onPress={onDismiss} variant="secondary" disabled={busy} />
        </View>
      </ScrollView>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  symbol: {
    width: size.touchTarget, height: size.touchTarget, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { gap: spacing.space4 },
  actions: { gap: spacing.space2 },
});
