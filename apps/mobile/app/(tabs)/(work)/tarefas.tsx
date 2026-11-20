import { EmptyState, Screen } from '../../../src/components';
import { useSplitView } from '../../../src/components/split-view';
import { TaskListScreen } from '../../../src/features/tasks/screens';
import { strings } from '../../../src/lib/strings';

export default function TasksRoute() {
  const split = useSplitView();
  return split ? <Screen><EmptyState message={strings.feedback.selectDetail} /></Screen> : <TaskListScreen />;
}
