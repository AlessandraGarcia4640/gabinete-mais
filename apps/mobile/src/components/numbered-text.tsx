import { StyleSheet, View } from 'react-native';
import { dimensions, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';

export function NumberedText({ position, text, accessibilityLabel }: { position: number; text: string; accessibilityLabel: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View aria-hidden style={[styles.number, { backgroundColor: colors.brandSoft }]}>
        <AppText variant="data" color="brandText">{position}</AppText>
      </View>
      <AppText variant="body" style={styles.text} accessibilityLabel={accessibilityLabel}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space3 },
  number: { width: dimensions.smallAvatar, height: dimensions.smallAvatar, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
});
