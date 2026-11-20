import { StyleSheet, View } from 'react-native';
import { iconSize, line, radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';
import { Icon } from './icon';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  attribution?: string;
}

export function Checkbox({ label, checked, onChange, disabled = false, attribution }: CheckboxProps) {
  const { colors } = useTheme();
  return (
    <Control
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityHint={attribution}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={styles.row}
      pressedStyle={{ backgroundColor: colors.surfaceSunken }}
    >
      <View style={[styles.box, {
        backgroundColor: checked ? colors.brand : colors.surface,
        borderColor: checked ? colors.brand : colors.borderStrong,
      }]}>
        {checked && <Icon name="check" size={iconSize.small} color="onBrand" />}
      </View>
      <View style={styles.copy}>
        <AppText variant="body" color={checked ? 'inkMuted' : 'ink'} style={checked && styles.marked}>{label}</AppText>
        {!!attribution && <AppText variant="caption" color="inkMuted">{attribution}</AppText>}
      </View>
    </Control>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', minHeight: size.touchTarget, minWidth: size.touchTarget, width: '100%',
    alignItems: 'flex-start', gap: spacing.space3, paddingVertical: spacing.space3,
    paddingHorizontal: spacing.space4, borderRadius: radius.sm,
  },
  box: {
    width: iconSize.standard, height: iconSize.standard, borderWidth: line.strong, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  copy: { flex: 1 },
  marked: { textDecorationLine: 'line-through' },
});
