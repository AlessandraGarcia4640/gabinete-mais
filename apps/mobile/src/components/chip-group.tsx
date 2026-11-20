import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '../lib/theme';

interface ChipGroupProps {
  label: string;
  selection?: 'filter' | 'radio';
  horizontal?: boolean;
}

export function ChipGroup({ label, selection = 'filter', horizontal, children }: PropsWithChildren<ChipGroupProps>) {
  const role = selection === 'radio' ? 'radiogroup' : 'group';
  return (
    <View accessibilityLabel={label} role={role}>
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {children}
        </ScrollView>
      ) : <View style={[styles.row, styles.wrap]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.space2, paddingVertical: spacing.space1 },
  wrap: { flexWrap: 'wrap' },
});
