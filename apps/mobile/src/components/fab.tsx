import { StyleSheet } from 'react-native';
import { dimensions, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon } from './icon';

interface FabProps {
  label: string;
  onPress: () => void;
}

export function Fab({ label, onPress }: FabProps) {
  const { colors, shadow } = useTheme();
  return (
    <Control
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.fab, { backgroundColor: colors.brand, boxShadow: shadow.level2 }]}
      pressedStyle={{ backgroundColor: colors.brandHover }}
    >
      <Icon name="plus" color="onBrand" />
      <AppText variant="bodyStrong" color="onBrand" style={styles.label}>{label}</AppText>
    </Control>
  );
}

const styles = StyleSheet.create({
  fab: {
    minHeight: dimensions.fab, maxWidth: '100%', position: 'absolute',
    bottom: spacing.space4, end: spacing.space4, borderRadius: radius.lg,
    paddingHorizontal: spacing.space4, paddingVertical: spacing.space2, gap: spacing.space2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  label: { flexShrink: 1 },
});
