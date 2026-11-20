import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { dimensions, iconSize, line, radius, size, spacing, typography } from '../lib/theme';
import { createThemedStyles, useAppFonts, useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { useFocusRing } from './control';
import { Icon } from './icon';

interface FieldMessages {
  label: string;
  help?: string;
  errorText?: string;
}

interface TextFieldProps extends FieldMessages, TextInputProps {
  mono?: boolean;
  accessory?: ReactNode;
}

export function FieldFrame({ label, help, errorText, children }: PropsWithChildren<FieldMessages>) {
  return (
    <View style={frameStyles.field}>
      <AppText variant="label">{label}</AppText>
      {children}
      {!!errorText && (
        <View style={frameStyles.error}>
          <Icon name="alert-circle" size={iconSize.extraSmall} color="danger" />
          <AppText variant="caption" color="danger" accessibilityRole="alert" accessibilityLiveRegion="polite" style={frameStyles.message}>
            {errorText}
          </AppText>
        </View>
      )}
      {!errorText && !!help && <AppText variant="caption" color="inkMuted">{help}</AppText>}
    </View>
  );
}

export function TextField({ label, help, errorText, style, mono, accessory, onFocus, onBlur, ...props }: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fontsLoaded = useAppFonts();
  const [focused, setFocused] = useState(false);
  const ring = useFocusRing(focused);
  return (
    <FieldFrame label={label} help={help} errorText={errorText}>
      <View>
        <TextInput
          {...props}
          allowFontScaling={props.allowFontScaling ?? true}
          accessibilityLabel={label}
          accessibilityState={{ disabled: props.editable === false }}
          accessibilityHint={[props.accessibilityHint ?? help, errorText].filter(Boolean).join('. ') || undefined}
          placeholderTextColor={colors.inkSubtle}
          selectionColor={colors.brand}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={[
            styles.input, fontsLoaded && (mono ? styles.mono : styles.font),
            props.multiline && styles.multiline, !!accessory && styles.hasAccessory,
            style, !!errorText && styles.invalid, ring,
          ]}
        />
        {!!accessory && <View style={styles.accessory}>{accessory}</View>}
      </View>
    </FieldFrame>
  );
}

const frameStyles = StyleSheet.create({
  field: { gap: spacing.space1 },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.space1 },
  message: { flexShrink: 1 },
});

const useStyles = createThemedStyles((theme) => ({
  input: {
    minHeight: size.controlHeight, borderWidth: line.control, borderColor: theme.colors.borderStrong,
    borderRadius: radius.md, backgroundColor: theme.colors.surface, paddingHorizontal: spacing.space4,
    paddingVertical: spacing.space2, color: theme.colors.ink, fontSize: typography.body.fontSize,
  },
  font: { fontFamily: typography.body.fontFamily },
  mono: { fontFamily: typography.data.fontFamily },
  multiline: { minHeight: dimensions.textArea, textAlignVertical: 'top' },
  hasAccessory: { paddingEnd: size.controlHeight },
  accessory: { position: 'absolute', end: line.strong, top: line.strong },
  invalid: { borderColor: theme.colors.danger, borderWidth: line.strong },
}));
