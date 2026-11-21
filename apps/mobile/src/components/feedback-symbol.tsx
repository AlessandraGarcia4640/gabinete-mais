import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { Icon, type IconName } from './icon';

export function FeedbackSymbol({ icon, danger = false }: { icon: IconName; danger?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.symbol, { backgroundColor: danger ? colors.dangerSoft : colors.surfaceSunken }]}>
      <Icon name={icon} color={danger ? 'danger' : 'inkMuted'} />
    </View>
  );
}

const styles = StyleSheet.create({
  symbol: {
    minWidth: spacing.space16, minHeight: spacing.space16, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});
