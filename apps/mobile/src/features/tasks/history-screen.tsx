import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { TaskEventPage } from '@gabinete-plus/shared';
import { AppBar, Button, EmptyState, ErrorState, LoadingState, Screen, type IconName } from '../../components';
import { TimelineEntry } from '../../components/timeline';
import { strings } from '../../lib/strings';
import { size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { taskError, useTask, useTaskHistory, useTaskPerson } from './hooks';

const copy = strings.tasks;
type TaskEvent = TaskEventPage['items'][number];
const symbols: Record<TaskEvent['type'], IconName> = {
  CREATED: 'plus', EDITED: 'edit-2', REASSIGNED: 'users', STATUS_CHANGED: 'clock',
};
const timestamp = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function HistoryEntry({ event, first, last }: { event: TaskEvent; first: boolean; last: boolean }) {
  const { user } = useSession();
  const actor = useTaskPerson(event.actorId);
  const previous = useTaskPerson(event.fromAssigneeId ?? undefined);
  const next = useTaskPerson(event.toAssigneeId ?? undefined);
  const name = (id: string | null, fallback?: string) =>
    (id === user?.id ? user.name : fallback) ?? copy.personUnknown;
  let change = '';
  if (event.type === 'STATUS_CHANGED' && event.fromStatus && event.toStatus) {
    change = copy.historyChange(strings.dashboard.status[event.fromStatus], strings.dashboard.status[event.toStatus]);
  }
  if (event.type === 'REASSIGNED') {
    change = copy.historyChange(name(event.fromAssigneeId, previous.data?.name), name(event.toAssigneeId, next.data?.name));
  }
  if (event.type === 'EDITED') {
    const fields = event.changedFields.flatMap((field) => {
      const entry = Object.entries(copy.fields).find(([key]) => key === field);
      return entry ? [entry[1]] : [];
    });
    change = copy.historyFields(fields);
  }
  return <TimelineEntry
    title={copy.events[event.type]}
    detail={copy.historyDetail(name(event.actorId, actor.data?.name), change)}
    time={timestamp.format(new Date(event.createdAt)).replace(',', '')}
    icon={symbols[event.type]}
    first={first}
    last={last}
  />;
}

export function TaskHistory({ id }: { id?: string }) {
  const router = useRouter();
  const query = useTaskHistory(id);
  const task = useTask(id);
  const data = [...new Map((query.data?.pages.flatMap((page) => page.items) ?? []).map((event) => [event.id, event])).values()];
  const back = () => {
    if (router.canGoBack()) router.back();
    else if (id) router.replace({ pathname: '/tarefa/[id]', params: { id } });
    else router.replace('/tarefas');
  };
  const initialError = query.isError && !query.data;
  const empty = !id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : initialError
    ? <ErrorState message={taskError(query.error)} retry={() => void query.refetch()} />
    : <EmptyState message={copy.emptyHistory} />;
  return (
    <Screen>
      <AppBar title={copy.history} subtitle={task.data?.title} onBack={back} />
      <View style={styles.content}>
        <FlashList
          data={data}
          keyExtractor={(event) => event.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <HistoryEntry event={item} first={index === 0} last={index === data.length - 1} />}
          refreshing={query.isRefetching}
          onRefresh={() => { if (id) void query.refetch(); }}
          ListEmptyComponent={empty}
          ListFooterComponent={
            <View style={styles.footer}>
              {query.isError && !initialError && <ErrorState updating retry={() => {
                if (query.isFetchNextPageError) void query.fetchNextPage();
                else void query.refetch();
              }} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost"
                loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  list: { paddingHorizontal: spacing.space4, paddingVertical: spacing.space2 },
  footer: { gap: spacing.space3, paddingVertical: spacing.space3 },
});
