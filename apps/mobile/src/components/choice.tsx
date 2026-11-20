import { AppText } from './app-text';
import { Pressable } from 'react-native';
import { size } from '../lib/theme';
import { createThemedStyles } from '../providers/theme-provider';
import { useState } from 'react';
export function Choice({ label, context, selected, onPress, disabled = false }: { label: string; context?: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="radio" accessibilityLabel={context ? `${context}: ${label}` : label} accessibilityState={{ checked: selected, disabled }} onPress={onPress} disabled={disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[styles.choice, selected && styles.selected, focused && styles.focused, disabled && styles.disabled]}>
    <AppText variant="bodyStrong" allowFontScaling style={[styles.label, selected && styles.selectedLabel]}>{label}</AppText></Pressable>;
}
const useStyles = createThemedStyles((theme) => ({ choice: { borderWidth: 2, borderColor: theme.colors.borderStrong, borderRadius: 10, padding: 12, minWidth: size.touchTarget, minHeight: size.touchTarget, justifyContent: 'center' }, selected: { backgroundColor: theme.colors.brand }, focused: { borderColor: theme.colors.ink }, disabled: { opacity: 0.65 }, label: { color: theme.colors.ink }, selectedLabel: { color: theme.colors.onBrand } }));
