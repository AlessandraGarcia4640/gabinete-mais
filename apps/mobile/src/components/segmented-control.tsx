import { StyleSheet, View } from 'react-native';
import { radius, size, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Control } from './control';

interface Segment<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string> {
  label: string;
  options: readonly [Segment<Value>, Segment<Value>, Segment<Value>?];
  value: Value;
  onChange: (value: Value) => void;
}

export function SegmentedControl<Value extends string>({ label, options, value, onChange }: SegmentedControlProps<Value>) {
  const { colors, shadow } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
      {options.map((option) => {
        if (!option) return null;
        const selected = option.value === value;
        return (
          <Control
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            hitSlop={(size.touchTarget - size.controlHeightSm) / 2}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.surface, boxShadow: shadow.level1 },
            ]}
            pressedStyle={{ backgroundColor: colors.surface }}
          >
            <AppText variant="label" emphasis={selected} color={selected ? 'ink' : 'inkMuted'} style={styles.label}>
              {option.label}
            </AppText>
          </Control>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.md, padding: spacing.space1, gap: spacing.space1 },
  segment: {
    flex: 1, minHeight: size.controlHeightSm, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center', padding: spacing.space2,
  },
  label: { textAlign: 'center' },
});
