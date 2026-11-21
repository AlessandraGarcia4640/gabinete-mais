import type { Task } from '@gabinete-plus/shared';
import { strings } from '../../lib/strings';
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
