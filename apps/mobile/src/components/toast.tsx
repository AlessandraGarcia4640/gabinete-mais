import { StyleSheet, View } from 'react-native';
import { iconSize, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Icon } from './icon';

export function Toast({ message }: { message: string }) {
  const { colors, shadow } = useTheme();
  return (
    <View style={[styles.toast, { backgroundColor: colors.ink, boxShadow: shadow.level2 }]}>
      <Icon name="check-circle" size={iconSize.small} color="bg" />
      <AppText variant="label" color="bg" role="status" accessibilityLiveRegion="polite" style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.space3,
    paddingHorizontal: spacing.space4, paddingVertical: spacing.space3, borderRadius: radius.md,
  },
  message: { flex: 1 },
});
