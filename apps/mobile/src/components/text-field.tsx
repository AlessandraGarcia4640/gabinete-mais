import { TextInput, View, type TextInputProps } from 'react-native';
import { radius, size, spacing, typography } from '../lib/theme';
import { createThemedStyles, useAppFonts, useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
interface Props extends TextInputProps { label: string; errorText?: string }
export function TextField({ label, errorText, style, ...props }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const fontsLoaded = useAppFonts();
  return <View style={styles.field}><AppText variant="label">{label}</AppText>
    <TextInput {...props} allowFontScaling={props.allowFontScaling ?? true} accessibilityLabel={label} accessibilityState={{ disabled: props.editable === false }} accessibilityHint={[props.accessibilityHint, errorText].filter(Boolean).join('. ') || undefined} placeholderTextColor={theme.colors.inkSubtle} selectionColor={theme.colors.brand} style={[styles.input, fontsLoaded && styles.font, style, !!errorText && styles.invalid]} />
    {!!errorText && <AppText variant="caption" color="danger" accessibilityRole="alert" accessibilityLiveRegion="polite">{errorText}</AppText>}
  </View>;
}
const useStyles = createThemedStyles((theme) => ({
  field: { gap: spacing.space2 },
  input: {
    minHeight: size.controlHeight, borderWidth: 1, borderColor: theme.colors.borderStrong,
    borderRadius: radius.md, backgroundColor: theme.colors.surface, padding: spacing.space3,
    color: theme.colors.ink, fontSize: typography.body.fontSize,
  },
  font: { fontFamily: typography.body.fontFamily },
  invalid: { borderColor: theme.colors.danger },
}));
