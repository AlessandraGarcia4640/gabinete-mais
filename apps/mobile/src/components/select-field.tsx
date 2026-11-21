import type { ReactNode, Ref } from 'react';
import { StyleSheet, type View } from 'react-native';
import { iconSize, line, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon } from './icon';
import { FieldFrame } from './text-field';

interface SelectFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  expanded?: boolean;
  disabled?: boolean;
  help?: string;
  errorText?: string;
  optional?: boolean;
  start?: ReactNode;
  accessibilityLabel?: string;
  ref?: Ref<View>;
}

export function SelectField({
  label, value, placeholder, onPress, expanded = false, disabled = false, help, errorText,
  optional, start, accessibilityLabel, ref,
}: SelectFieldProps) {
  const { colors } = useTheme();
  return (
    <FieldFrame label={label} help={help} errorText={errorText} optional={optional}>
      <Control
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={errorText ?? help}
        accessibilityValue={{ text: value ?? placeholder }}
        accessibilityState={{ expanded, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={[styles.control, {
          backgroundColor: colors.surface,
          borderColor: errorText ? colors.danger : colors.borderStrong,
          borderWidth: errorText ? line.strong : line.control,
        }]}
        pressedStyle={{ backgroundColor: colors.surfaceSunken }}
      >
        {start}
        <AppText variant="body" color={value ? 'ink' : 'inkSubtle'} style={styles.value}>{value ?? placeholder}</AppText>
        <Icon name="chevron-down" size={iconSize.small} color="inkMuted" />
      </Control>
    </FieldFrame>
  );
}

const styles = StyleSheet.create({
  control: {
    minHeight: size.controlHeight, paddingHorizontal: spacing.space4,
    paddingVertical: spacing.space2, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.space2,
  },
  value: { flex: 1 },
});
