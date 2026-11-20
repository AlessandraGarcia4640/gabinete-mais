import { StyleSheet, View } from 'react-native';
import { iconSize, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

export function Tag({ label, icon }: { label: string; icon?: IconName }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: colors.brandSoft }]}>
      {!!icon && <Icon name={icon} size={iconSize.extraSmall} color="brandText" />}
      <AppText variant="caption" emphasis color="brandText" style={styles.label}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: spacing.space1,
    borderRadius: radius.full, paddingHorizontal: spacing.space2, paddingVertical: spacing.space1 / 2,
  },
  label: { flexShrink: 1 },
});
