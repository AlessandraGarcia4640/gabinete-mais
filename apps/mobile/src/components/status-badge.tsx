import type { ChecklistRun, Task } from '@gabinete-plus/shared';
import { StyleSheet, View } from 'react-native';
import { strings } from '../lib/strings';
import { iconSize, radius, spacing, type ColorTokens } from '../lib/theme';
import { useTheme } from '../providers/theme-provider';
import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

type Status = Task['status'] | ChecklistRun['status'];
type Tone = { background: keyof ColorTokens; color: keyof ColorTokens; icon: IconName; label: string };

const open: Tone = { background: 'infoSoft', color: 'statusAberta', icon: 'circle', label: strings.dashboard.status.ABERTA };

const statusTones: Record<Status, Tone> = {
  ABERTA: open,
  POR_FAZER: { ...open, label: strings.checklists.status.POR_FAZER },
  EM_ANDAMENTO: { background: 'accentSoft', color: 'statusAndamento', icon: 'clock', label: strings.dashboard.status.EM_ANDAMENTO },
  CONCLUIDA: { background: 'successSoft', color: 'statusConcluida', icon: 'check-circle', label: strings.dashboard.status.CONCLUIDA },
  CANCELADA: { background: 'surfaceSunken', color: 'statusCancelada', icon: 'minus-circle', label: strings.dashboard.status.CANCELADA },
};

const late: Tone = { background: 'dangerSoft', color: 'danger', icon: 'alert-triangle', label: strings.dashboard.overdue };

export function StatusBadge({ status, overdue = false }: { status: Status; overdue?: boolean }) {
  const { colors } = useTheme();
  const appearance = overdue ? late : statusTones[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors[appearance.background] }]}>
      <Icon name={appearance.icon} color={appearance.color} size={iconSize.extraSmall} />
      <AppText variant="caption" emphasis color={appearance.color} style={styles.label}>{appearance.label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center',
    gap: spacing.space1, borderRadius: radius.full, paddingHorizontal: spacing.space2,
    paddingVertical: spacing.space1 / 2, minHeight: iconSize.standard,
  },
  label: { flexShrink: 1 },
});
