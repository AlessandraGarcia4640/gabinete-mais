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

export function ListGroupItem({ first, last, divider, children }: PropsWithChildren<{ first: boolean; last: boolean; divider?: boolean }>) {
  const { colors } = useTheme();
  return (
    <View style={[
      styles.item, { backgroundColor: colors.surface, borderColor: colors.border },
      first && styles.first, last && styles.last, !first && divider && styles.divider,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.space2 },
  group: { borderRadius: radius.lg, borderWidth: line.thin },
  item: { borderStartWidth: line.thin, borderEndWidth: line.thin },
  first: { borderTopWidth: line.thin, borderTopStartRadius: radius.lg, borderTopEndRadius: radius.lg },
  last: { borderBottomWidth: line.thin, borderBottomStartRadius: radius.lg, borderBottomEndRadius: radius.lg },
  divider: { borderTopWidth: line.thin },
});
