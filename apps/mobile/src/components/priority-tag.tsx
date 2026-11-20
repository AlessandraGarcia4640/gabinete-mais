import type { TaskPriority } from '@gabinete-plus/shared';
import { StyleSheet, View } from 'react-native';
import { strings } from '../lib/strings';
import { iconSize, spacing, type ColorTokens } from '../lib/theme';
import { AppText } from './app-text';
import { Icon } from './icon';

const palette: Record<TaskPriority, keyof ColorTokens> = {
  URGENTE: 'prioridadeUrgente',
  ALTA: 'prioridadeAlta',
  NORMAL: 'prioridadeNormal',
  BAIXA: 'prioridadeBaixa',
};

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  return (
    <View style={styles.inline}>
      <Icon name="flag" color={palette[priority]} size={iconSize.extraSmall} />
      <AppText variant="caption" emphasis color={palette[priority]}>{strings.dashboard.priority[priority]}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.space1 },
});
