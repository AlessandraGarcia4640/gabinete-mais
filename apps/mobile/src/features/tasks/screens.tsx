import { Screen } from '../../components/screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { AppBar } from '../../components/app-bar';
import { strings } from '../../lib/strings';
import { useSession } from '../../providers/session-provider';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { taskError, useTask } from './hooks';
import { taskActions } from './model';
import { TaskForm } from './form';
import { TaskDetail } from './detail-screen';
import { TaskHistory } from './history-screen';
function useId() { const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); return valid.success ? valid.data.id : undefined; }
export { TaskListScreen } from './list-screen';
export function TaskDetailScreen() {
  const id = useId();
  return <TaskDetail key={id} id={id} />;
}

export function TaskFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const id = useId(); const { user } = useSession(); const query = useTask(mode === 'edit' ? id : undefined); const router = useRouter();
  const cancel = () => {
    if (mode === 'edit' && id) router.replace({ pathname: '/tarefa/[id]', params: { id } });
    else router.replace('/tarefas');
  };
  if (mode === 'edit') {
    const header = <AppBar title={strings.tasks.edit} onBack={cancel} />;
    if (!id) return <Screen>{header}<EmptyState message={strings.tasks.notFound} /></Screen>;
    if (query.isPending) return <Screen>{header}<LoadingState /></Screen>;
    if (query.isError && !query.data) return <Screen>{header}<ErrorState message={taskError(query.error)} retry={() => void query.refetch()} /></Screen>;
    if (!query.data) return <Screen>{header}<EmptyState message={strings.tasks.notFound} /></Screen>;
    if (!taskActions(query.data, user).edit) return (
      <Screen>{header}
        <EmptyState message={query.data.status === 'CONCLUIDA' || query.data.status === 'CANCELADA' ? strings.tasks.closed : strings.tasks.forbidden} />
      </Screen>
    );
  }
  return <TaskForm key={mode === 'edit' ? id : 'new'} task={mode === 'edit' ? query.data : undefined} guardNavigation
    onSaved={(saved) => router.replace({ pathname: '/tarefa/[id]', params: { id: saved.id } })} onCancel={cancel} />;
}
export function TaskHistoryScreen() {
  return <TaskHistory id={useId()} />;
}
