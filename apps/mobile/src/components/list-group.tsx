import { Children, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { line, radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { Overline } from './overline';

export function ListGroup({ label, children }: PropsWithChildren<{ label?: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {!!label && <Overline>{label}</Overline>}
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {Children.map(children, (child, index) => child && (
          <View style={index > 0 && { borderTopColor: colors.border, borderTopWidth: line.thin }}>{child}</View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.space2 },
  group: { borderRadius: radius.lg, borderWidth: line.thin },
});
