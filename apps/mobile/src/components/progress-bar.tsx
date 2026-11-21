import { StyleSheet, View } from 'react-native';
import { strings } from '../lib/strings';
import { radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';

interface ProgressBarProps {
  completed: number;
  total: number;
  label: string;
}

export function ProgressBar({ completed, total, label }: ProgressBarProps) {
  const { colors } = useTheme();
  const current = Math.max(0, Math.min(completed, total));
  const part = total > 0 ? current / total : 0;
  const description = strings.checklists.progress(current, total);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: current, text: description }}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={description}
      accessibilityLiveRegion="polite"
      style={styles.progress}
    >
      <View style={styles.labels}>
        <AppText variant="caption" color="inkMuted">{label}</AppText>
        <AppText variant="data">{strings.checklists.progressFraction(current, total)}</AppText>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
        <View style={[styles.fill, { backgroundColor: colors.brand, width: `${part * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { gap: spacing.space1 },
  labels: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.space2 },
  track: { height: spacing.space2, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
