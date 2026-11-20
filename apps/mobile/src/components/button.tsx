import { ActivityIndicator, Pressable } from 'react-native';
import { opacity, radius, size, spacing } from '../lib/theme';
import { createThemedStyles, useTheme } from '../providers/theme-provider';
import { useState } from 'react';
import { AppText } from './app-text';
interface Props { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; secondary?: boolean }
export function Button({ label, onPress, loading = false, disabled = false, secondary = false }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || loading, busy: loading }}
    disabled={disabled || loading} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [styles.button, secondary && styles.secondary, pressed && { backgroundColor: secondary ? theme.colors.surfaceSunken : theme.colors.brandHover }, focused && styles.focused, (disabled || loading) && styles.dim]}>
    {loading && <ActivityIndicator color={secondary ? theme.colors.brandText : theme.colors.onBrand} />}
    <AppText variant="bodyStrong" color={secondary ? 'brandText' : 'onBrand'} style={styles.label}>{label}</AppText>
  </Pressable>;
}
const useStyles = createThemedStyles((theme) => ({
  button: {
    minHeight: size.controlHeight, minWidth: size.touchTarget, borderWidth: 2, borderColor: 'transparent',
    backgroundColor: theme.colors.brand, borderRadius: radius.md, padding: spacing.space3,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: spacing.space2,
  },
  label: { flexShrink: 1, textAlign: 'center' },
  secondary: { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong },
  focused: { borderColor: theme.colors.focus },
  dim: { opacity: opacity.disabled },
}));
