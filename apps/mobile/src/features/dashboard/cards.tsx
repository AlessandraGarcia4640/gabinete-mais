import { AppText } from '../../components/app-text';
import type { Routine, Task } from '@gabinete-plus/shared';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { Card } from '../../components/card';
import { TaskCard as TaskCardView } from '../../components/task-card';
import { displayDate } from './model';
export function TaskCard({ task, onPress }: { task: Task; onPress?: () => void }) {
  const deadline = task.dueDate ? displayDate(task.dueDate) : strings.dashboard.noDueDate;
  return onPress ? <TaskCardView task={task} deadline={deadline} onPress={onPress} />
    : <TaskCardView task={task} deadline={deadline} />;
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
