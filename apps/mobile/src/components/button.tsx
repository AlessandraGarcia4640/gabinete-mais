import type { Ref } from 'react';
import { ActivityIndicator, StyleSheet, type StyleProp, type View, type ViewStyle } from 'react-native';
import { iconSize, line, radius, size, spacing, type ColorTokens } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon, type IconName } from './icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
}

type ButtonColors = {
  text: keyof ColorTokens;
  fill?: keyof ColorTokens;
  border?: keyof ColorTokens;
  pressed: keyof ColorTokens;
};

const palette: Record<Variant, ButtonColors> = {
  primary: { text: 'onBrand', fill: 'brand', border: 'brand', pressed: 'brandHover' },
  secondary: { text: 'ink', fill: 'surface', border: 'borderStrong', pressed: 'surfaceSunken' },
  ghost: { text: 'brandText', pressed: 'brandSoft' },
  danger: { text: 'onDanger', fill: 'danger', border: 'danger', pressed: 'danger' },
  dangerGhost: { text: 'danger', pressed: 'dangerSoft' },
};

export function Button({
  label, onPress, loading = false, disabled = false, variant = 'primary', size: density = 'md', icon, style, ref,
}: ButtonProps) {
  const { colors } = useTheme();
  const tone = palette[variant];
  const compact = density === 'sm';
  const unavailable = disabled || loading;
  return (
    <Control
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      hitSlop={compact ? (size.touchTarget - size.controlHeightSm) / 2 : undefined}
      onPress={onPress}
      style={[
        styles.button,
        compact && styles.compact,
        tone.fill && { backgroundColor: colors[tone.fill] },
        tone.border && { borderColor: colors[tone.border], borderWidth: line.control },
        style,
      ]}
      pressedStyle={{ backgroundColor: colors[tone.pressed] }}
    >
      {loading ? <ActivityIndicator color={colors[tone.text]} /> :
        icon && <Icon name={icon} size={iconSize.small} color={tone.text} />}
      <AppText variant={compact ? 'label' : 'bodyStrong'} color={tone.text} style={styles.label}>{label}</AppText>
    </Control>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: size.controlHeight, minWidth: size.touchTarget,
    borderRadius: radius.md, paddingHorizontal: spacing.space5, paddingVertical: spacing.space2,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: spacing.space2,
  },
  compact: { minHeight: size.controlHeightSm, paddingHorizontal: spacing.space3, borderRadius: radius.sm },
  label: { flexShrink: 1, textAlign: 'center' },
});
