import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { line, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { Control } from './control';

type CardProps = PropsWithChildren<{ flat?: boolean; style?: StyleProp<ViewStyle> } & (
  { onPress: () => void; label: string; selected?: boolean } |
  { onPress?: never; label?: never; selected?: never }
)>;

export function Card({ children, style, flat = false, onPress, label, selected }: CardProps) {
  const { colors, shadow } = useTheme();
  const surface = {
    backgroundColor: flat ? colors.surfaceSunken : selected ? colors.brandSoft : colors.surface,
    borderColor: selected ? colors.brand : colors.border,
  };

  if (!onPress) return <View style={[styles.card, surface, style]}>{children}</View>;
  return (
    <Control
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={[styles.card, styles.interactive, surface, { boxShadow: shadow.level1 }, style]}
      pressedStyle={{ backgroundColor: colors.surfaceSunken, borderColor: colors.borderStrong }}
    >
      {children}
    </Control>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: line.thin, borderRadius: radius.lg, padding: spacing.space4, gap: spacing.space3 },
  interactive: { minHeight: size.touchTarget, minWidth: size.touchTarget },
});
