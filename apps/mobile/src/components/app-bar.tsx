import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { strings } from '../lib/strings';
import { dimensions, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { IconButton } from './icon-button';

interface AppBarProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function AppBar({ title, onBack, action }: AppBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.bg }]}>
      {onBack && <IconButton label={strings.nav.back} icon="arrow-left" onPress={onBack} />}
      <AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{title}</AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: dimensions.appBar, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.space2, paddingVertical: spacing.space1, gap: spacing.space1,
  },
  title: { flex: 1, paddingHorizontal: spacing.space2 },
});
