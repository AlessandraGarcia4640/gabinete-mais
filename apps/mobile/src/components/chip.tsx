import type { Ref } from 'react';
import { Platform, StyleSheet, type View } from 'react-native';
import { iconSize, line, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon, type IconName } from './icon';

interface ChipProps {
  label: string;
  context?: string;
  selected: boolean;
  onPress: () => void;
  mode?: 'filter' | 'radio';
  icon?: IconName;
  disabled?: boolean;
  ref?: Ref<View>;
}

export function Chip({ label, context, selected, onPress, mode = 'filter', icon, disabled = false, ref }: ChipProps) {
  const { colors } = useTheme();
  const role = mode === 'radio' ? 'radio' : Platform.OS === 'web' ? 'button' : 'togglebutton';
  const webState = mode === 'filter' && Platform.OS === 'web' ? { 'aria-pressed': selected } : {};
  const symbol = selected ? 'check' : icon;
  return (
    <Control
      {...webState}
      ref={ref}
      aria-checked={mode === 'radio' ? selected : undefined}
      accessibilityRole={role}
      accessibilityLabel={context ? `${context}: ${label}` : label}
      accessibilityState={role === 'button' ? { disabled } : { checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, {
        backgroundColor: selected ? colors.brandSoft : colors.surface,
        borderColor: selected ? colors.brand : colors.borderStrong,
      }]}
      pressedStyle={{ backgroundColor: selected ? colors.brandSoft : colors.surfaceSunken }}
      hitSlop={(size.touchTarget - size.controlHeightSm) / 2}
    >
      {!!symbol && <Icon name={symbol} size={iconSize.extraSmall} color={selected ? 'brandText' : 'ink'} />}
      <AppText variant="label" style={styles.text} emphasis={selected}>{label}</AppText>
    </Control>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: size.controlHeightSm, borderWidth: line.control, borderRadius: radius.full,
    paddingHorizontal: spacing.space3, paddingVertical: spacing.space1, alignItems: 'center',
    flexDirection: 'row', gap: spacing.space1,
  },
  text: { flexShrink: 1 },
});
