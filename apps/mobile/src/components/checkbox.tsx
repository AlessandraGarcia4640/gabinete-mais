import { AppText } from './app-text';
import { Pressable } from 'react-native';
import { size } from '../lib/theme';
import { createThemedStyles } from '../providers/theme-provider';
import { useState } from 'react';
export function Checkbox({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled }} disabled={disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => onChange(!checked)} style={[styles.control, focused && styles.focused, disabled && styles.disabled]}>
    <AppText variant="bodyStrong" allowFontScaling style={styles.label}>{checked ? '☑' : '☐'} {label}</AppText></Pressable>;
}
const useStyles = createThemedStyles((theme) => ({ control: { minHeight: size.touchTarget, minWidth: size.touchTarget, borderWidth: 2, borderColor: 'transparent', borderRadius: 10, padding: 4, justifyContent: 'center' }, focused: { borderColor: theme.colors.brand }, disabled: { opacity: 0.65 }, label: { color: theme.colors.ink } }));
