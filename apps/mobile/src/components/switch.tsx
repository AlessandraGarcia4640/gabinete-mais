import { StyleSheet, View } from 'react-native';
import { dimensions, line, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, description, checked, onChange, disabled = false }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <Control
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      pressedStyle={{ backgroundColor: colors.surfaceSunken }}
    >
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {!!description && <AppText variant="caption" color="inkMuted">{description}</AppText>}
      </View>
      <View style={[styles.track, {
        backgroundColor: checked ? colors.brand : colors.surface,
        borderColor: checked ? colors.brand : colors.borderStrong,
        alignItems: checked ? 'flex-end' : 'flex-start',
      }]}>
        <View style={[styles.knob, { backgroundColor: checked ? colors.onBrand : colors.borderStrong }]} />
      </View>
    </Control>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', minHeight: size.touchTarget, alignItems: 'center', gap: spacing.space4,
    borderWidth: line.thin, borderRadius: radius.lg, paddingVertical: spacing.space3, paddingHorizontal: spacing.space4,
  },
  copy: { flex: 1 },
  track: {
    width: size.controlHeight, height: spacing.space8, borderRadius: radius.full,
    borderWidth: line.strong, paddingHorizontal: spacing.space1, justifyContent: 'center',
  },
  knob: { width: dimensions.switchKnob, height: dimensions.switchKnob, borderRadius: radius.full },
});
