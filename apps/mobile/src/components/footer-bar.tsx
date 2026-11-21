import { Children, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { line, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';

export function FooterBar({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {Children.map(children, (child) => child && <View style={styles.action}>{child}</View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', paddingHorizontal: spacing.space4, paddingBottom: spacing.space4,
    paddingTop: spacing.space3, gap: spacing.space3, borderTopWidth: line.thin,
  },
  action: { flex: 1, minWidth: 0 },
});
