import type { PropsWithChildren } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, size, spacing } from '../lib/theme';
import { createThemedStyles } from '../providers/theme-provider';
import { useState } from 'react';
type Props = PropsWithChildren<{ style?: StyleProp<ViewStyle> } & ({ onPress: () => void; label: string } | { onPress?: never; label?: never })>;
export function Card({ children, style, onPress, label }: Props) {
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  if (onPress) return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [styles.card, style, styles.interactive, focused && styles.focused, pressed && styles.pressed]}>{children}</Pressable>;
  return <View style={[styles.card, style]}>{children}</View>;
}
const useStyles = createThemedStyles((theme) => ({
  card: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: radius.lg, padding: spacing.space4, gap: spacing.space2, marginBottom: spacing.space3,
  },
  interactive: { minHeight: size.touchTarget, minWidth: size.touchTarget, borderWidth: 2 },
  focused: { borderColor: theme.colors.focus },
  pressed: { backgroundColor: theme.colors.surfaceSunken },
}));
