import type { ReactNode, Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { dimensions, iconSize, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon, type IconName } from './icon';

interface ListRowProps {
  title: string;
  titleVariant?: 'heading' | 'data';
  description?: string;
  descriptionLines?: number;
  start?: ReactNode;
  end?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
  selectable?: boolean;
  selection?: 'radio';
  ref?: Ref<View>;
}

export function ListRow({
  title, titleVariant = 'heading', description, descriptionLines, start, end, icon, onPress, selected, accessibilityLabel, selectable, selection, ref,
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
        <AppText variant={titleVariant} numberOfLines={selectable ? undefined : 2} selectable={selectable}>{title}</AppText>
        {!!description && <AppText variant="caption" color="inkMuted" numberOfLines={descriptionLines}>{description}</AppText>}
      </View>
      {end}
      {onPress && !selection && <Icon name="chevron-right" size={iconSize.small} color="inkSubtle" />}
    </>
  );
  if (!onPress) return <View ref={ref} style={styles.row}>{content}</View>;
  return (
    <Control
      ref={ref}
      accessibilityRole={selection ?? 'button'}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={description}
      accessibilityState={selection ? { checked: !!selected } : selected === undefined ? undefined : { selected }}
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
