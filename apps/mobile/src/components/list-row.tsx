import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { dimensions, iconSize, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon, type IconName } from './icon';

interface ListRowProps {
  title: string;
  description?: string;
  start?: ReactNode;
  end?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}

export function ListRow({
  title, description, start, end, icon, onPress, selected, accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();
  const content = (
    <>
      {start ?? (icon && (
        <View style={[styles.icon, { backgroundColor: colors.brandSoft }]}>
          <Icon name={icon} size={iconSize.small} color="brandText" />
        </View>
      ))}
      <View style={styles.copy}>
        <AppText variant="heading" numberOfLines={2}>{title}</AppText>
        {!!description && <AppText variant="caption" color="inkMuted">{description}</AppText>}
      </View>
      {end}
      {onPress && <Icon name="chevron-right" size={iconSize.small} color="inkSubtle" />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Control
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={[styles.row, selected && { backgroundColor: colors.brandSoft }]}
      pressedStyle={{ backgroundColor: colors.surfaceSunken }}
    >
      {content}
    </Control>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', minHeight: dimensions.listRow, gap: spacing.space3,
    paddingVertical: spacing.space3, paddingHorizontal: spacing.space4, borderRadius: radius.sm,
  },
  icon: {
    width: size.controlHeightSm, height: size.controlHeightSm, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
});
