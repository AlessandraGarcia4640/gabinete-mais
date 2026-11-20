import type { Task } from '@gabinete-plus/shared';
import { StyleSheet, View } from 'react-native';
import { iconSize, spacing, type ColorTokens } from '../lib/theme';
import { AppText } from './app-text';
import { Avatar } from './avatar';
import { Card } from './card';
import { Icon } from './icon';
import { PriorityTag } from './priority-tag';
import { StatusBadge } from './status-badge';

type TaskCardProps = {
  task: Pick<Task, 'title' | 'status' | 'priority' | 'isOverdue'>;
  deadline: string;
  deadlineToday?: boolean;
  linkedResource?: string;
  assignee?: string;
} & ({ onPress: () => void; selected?: boolean } | { onPress?: never; selected?: never });

export function TaskCard({
  task, deadline, deadlineToday, linkedResource, assignee, onPress, selected,
}: TaskCardProps) {
  const deadlineColor: keyof ColorTokens = task.isOverdue ? 'danger' : deadlineToday ? 'accentText' : 'inkMuted';
  const content = (
    <>
      <View style={styles.row}>
        <StatusBadge status={task.status} overdue={task.isOverdue} />
        <PriorityTag priority={task.priority} />
      </View>
      <AppText variant="heading" numberOfLines={2}>{task.title}</AppText>
      {!!linkedResource && (
        <View style={styles.meta}>
          <Icon name="list" size={iconSize.extraSmall} color="inkMuted" />
          <AppText variant="caption" color="inkMuted" style={styles.label}>{linkedResource}</AppText>
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.meta}>
          <Icon name="calendar" size={iconSize.extraSmall} color={deadlineColor} />
          <AppText variant="data" color={deadlineColor} style={styles.label}>{deadline}</AppText>
        </View>
        {!!assignee && (
          <View style={styles.meta}>
            <Avatar name={assignee} size="sm" />
            <AppText variant="caption" color="inkMuted" style={styles.label}>{assignee}</AppText>
          </View>
        )}
      </View>
    </>
  );
  return onPress ? <Card onPress={onPress} label={task.title} selected={selected}>{content}</Card> : <Card>{content}</Card>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space2,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2, flexShrink: 1 },
  label: { flexShrink: 1 },
});
