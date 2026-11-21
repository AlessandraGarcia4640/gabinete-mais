import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { dimensions, line, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';

interface KeyValueItem {
  label: string;
  value: string | ReactElement;
  data?: boolean;
}

export function KeyValueList({ items }: { items: readonly KeyValueItem[] }) {
  const { colors } = useTheme();
  return (
    <View>
      {items.map(({ label, value, data }, index) => (
        <View key={label} style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: line.thin }]}>
          <AppText variant="label" color="inkMuted" style={styles.label}>{label}</AppText>
          <View style={styles.value}>
            {typeof value === 'string' ? <AppText variant={data ? 'data' : 'body'}>{value}</AppText> : value}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.space3, gap: spacing.space3 },
  label: { maxWidth: '45%', width: dimensions.keyColumn },
  value: { flex: 1, minWidth: 0 },
});
