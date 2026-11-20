import { AppText } from '../../components/app-text';
import { View } from 'react-native';
import { Card } from '../../components/card';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema, type TaskEventPage } from '@gabinete-plus/shared';
import { Button } from '../../components/button';
import { AppBar } from '../../components/app-bar';
import { strings } from '../../lib/strings';
import { useSession } from '../../providers/session-provider';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { taskError, useTask, useTaskHistory, useTaskPerson } from './hooks';
import { taskActions } from './model';
import { TaskForm } from './form';
import { TaskDetail } from './detail-screen';
import { useStyles } from './styles';
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
    if (query.isError) return <Screen>{header}<ErrorState message={taskError(query.error)} retry={() => void query.refetch()} /></Screen>;
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
  const styles = useStyles();
  const id = useId(); const query = useTaskHistory(id); const data = [...new Map((query.data?.pages.flatMap((page) => page.items) ?? []).map((event) => [event.id, event])).values()];
  if (!id) return <EmptyState message={strings.tasks.notFound} />; if (query.isPending) return <LoadingState />;
  if (query.isError && !query.data) return <View><AppText variant="caption" style={styles.error}>{taskError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  return <Screen><FlashList data={data} keyExtractor={(event) => event.id} contentContainerStyle={styles.content} renderItem={({ item }) => <EventRow event={item} />}
    ListEmptyComponent={<EmptyState message={strings.tasks.emptyHistory} />} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
    ListFooterComponent={<View style={styles.section}>{query.isError && <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />}{query.hasNextPage && <Button label={strings.feedback.loadMore} loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}</View>} /></Screen>;
}
function EventRow({ event }: { event: TaskEventPage['items'][number] }) {
  const styles = useStyles();
  const { user } = useSession(); const actor = useTaskPerson(event.actorId); const previous = useTaskPerson(event.fromAssigneeId ?? undefined); const next = useTaskPerson(event.toAssigneeId ?? undefined);
  const name = (id: string | null, fallback?: string) => id === user?.id ? user?.name : fallback ?? strings.tasks.personUnknown;
  return <Card><AppText variant="bodyStrong" style={styles.label}>{strings.tasks.events[event.type]}</AppText><AppText variant="body">{name(event.actorId, actor.data?.name)} · {new Date(event.createdAt).toLocaleString('pt-BR')}</AppText>
    {!!event.fromStatus && !!event.toStatus && <AppText variant="body">{strings.dashboard.status[event.fromStatus]} → {strings.dashboard.status[event.toStatus]}</AppText>}
    {event.type === 'REASSIGNED' && <AppText variant="body">{name(event.fromAssigneeId, previous.data?.name)} → {name(event.toAssigneeId, next.data?.name)}</AppText>}
    {event.changedFields.map((field) => field === 'title' || field === 'description' || field === 'instructions' || field === 'priority' || field === 'dueDate' ? <AppText variant="body" key={field}>{strings.tasks.fields[field]}</AppText> : null)}
  </Card>;
}
