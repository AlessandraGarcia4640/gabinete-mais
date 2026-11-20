import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { strings } from '../lib/strings';
import { dimensions, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { IconButton } from './icon-button';

interface AppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function AppBar({ title, subtitle, onBack, action }: AppBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.bg }]}>
      {onBack && <IconButton label={strings.nav.back} icon="arrow-left" onPress={onBack} />}
      <View style={styles.title}>
        <AppText variant="heading" accessibilityRole="header">{title}</AppText>
        {!!subtitle && <AppText variant="caption" color="inkMuted" numberOfLines={1}>{subtitle}</AppText>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: dimensions.appBar, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.space2, paddingVertical: spacing.space1, gap: spacing.space1,
  },
  title: { flex: 1, minWidth: 0, paddingHorizontal: spacing.space2 },
});
