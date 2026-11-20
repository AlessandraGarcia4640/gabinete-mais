import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { Card } from './card';

export function Skeleton() {
  const { colors } = useTheme();
  const fill = { backgroundColor: colors.surfaceSunken };
  return (
    <View aria-hidden>
      <Card>
        <View style={styles.row}>
          <View style={[styles.text, styles.status, fill]} />
          <View style={[styles.text, styles.priority, fill]} />
        </View>
        <View style={[styles.text, styles.title, fill]} />
        <View style={[styles.text, styles.caption, fill]} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { minHeight: spacing.space4, borderRadius: radius.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  status: { minHeight: spacing.space6, width: '35%' },
  priority: { width: '20%' },
  title: { minHeight: spacing.space5, width: '85%' },
  caption: { width: '50%' },
});
