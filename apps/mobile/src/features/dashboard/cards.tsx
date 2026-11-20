import { AppText } from '../../components/app-text';
import type { Routine, Task } from '@gabinete-plus/shared';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { Card } from '../../components/card';
import { TaskCard as TaskCardView } from '../../components/task-card';
import type { IconName } from '../../components/icon';
import { displayDate, previousDay } from './model';
export function TaskCard({ task, onPress, selected, referenceDay, assignee, showRoutine }: {
  task: Task; onPress?: () => void; selected?: boolean; referenceDay?: string; assignee?: string; showRoutine?: boolean;
}) {
  const deadlineToday = !!task.dueDate && task.dueDate === referenceDay;
  const deadlineYesterday = !!task.dueDate && !!referenceDay && task.isOverdue && task.dueDate === previousDay(referenceDay);
  const date = task.dueDate
    ? displayDate(task.dueDate, referenceDay ? { day: '2-digit', month: '2-digit' } : undefined)
    : strings.dashboard.noDueDate;
  const deadline = deadlineToday ? strings.dashboard.dueToday(date) : deadlineYesterday ? strings.dashboard.dueYesterday(date) : date;
  const links: { label: string; icon: IconName }[] = [];
  if (referenceDay && task.checklistRunId) links.push({ label: strings.tasks.run, icon: 'list' });
  if (showRoutine && task.routineId) links.push({ label: strings.tasks.routine, icon: 'repeat' });
  const appearance = { task, deadline, deadlineToday, links, assignee };
  return onPress ? <TaskCardView {...appearance} onPress={onPress} selected={selected} /> : <TaskCardView {...appearance} />;
}
export function RoutineCard({ routine, onPress }: { routine: Routine; onPress?: () => void }) {
  const styles = useStyles();
  const content = <><AppText variant="titleLg" style={styles.title}>{routine.title}</AppText>
    <AppText variant="caption" style={styles.description}>{routine.category} · {strings.dashboard.frequency[routine.frequency]}</AppText>
    {!!routine.description && <AppText variant="caption" numberOfLines={3} style={styles.description}>{routine.description}</AppText>}
    {!!routine.instructions && <AppText variant="caption" numberOfLines={4} style={styles.description}>{routine.instructions}</AppText>}
  </>; return onPress ? <Card label={routine.title} onPress={onPress}>{content}</Card> : <Card>{content}</Card>;
}
const useStyles = createThemedStyles((theme) => ({ title: { color: theme.colors.ink }, description: { color: theme.colors.inkMuted } }));
