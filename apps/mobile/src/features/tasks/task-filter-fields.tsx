import { taskPrioritySchema, taskStatusSchema, type Task } from '@gabinete-plus/shared';
import { StyleSheet, View } from 'react-native';
import { AppText, Chip, ChipGroup, Switch } from '../../components';
import { strings } from '../../lib/strings';
import { spacing } from '../../lib/theme';

export interface TaskFilters {
  status: Task['status'] | '';
  priority: Task['priority'] | '';
  overdue: boolean;
}

export const emptyFilters: TaskFilters = { status: '', priority: '', overdue: false };

const copy = strings.tasks;
const statusOptions = ['', ...taskStatusSchema.options] satisfies TaskFilters['status'][];
const [low, normal, high, urgent] = taskPrioritySchema.options;
const priorityOptions = ['', urgent, high, normal, low] satisfies TaskFilters['priority'][];

export function TaskFilterFields({ filters, onChange }: {
  filters: TaskFilters; onChange: (filters: TaskFilters) => void;
}) {
  return (
    <View style={styles.fields}>
      <View style={styles.group}>
        <AppText variant="label">{copy.status}</AppText>
        <ChipGroup label={copy.status} selection="radio">
          {statusOptions.map((status) => (
            <Chip key={status} label={status ? strings.dashboard.status[status] : copy.everyStatus} mode="radio"
              selected={filters.status === status} onPress={() => onChange({ ...filters, status })} />
          ))}
        </ChipGroup>
      </View>
      <View style={styles.group}>
        <AppText variant="label">{copy.priority}</AppText>
        <ChipGroup label={copy.priority} selection="radio">
          {priorityOptions.map((priority) => (
            <Chip key={priority} label={priority ? strings.dashboard.priority[priority] : copy.everyPriority} mode="radio"
              selected={filters.priority === priority} onPress={() => onChange({ ...filters, priority })} />
          ))}
        </ChipGroup>
      </View>
      <Switch label={copy.overdue} description={copy.overdueHelp} checked={filters.overdue}
        onChange={(overdue) => onChange({ ...filters, overdue })} />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.space5 },
  group: { gap: spacing.space1 },
});
