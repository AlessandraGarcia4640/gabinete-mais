import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import type { Task } from '@gabinete-plus/shared';
import {
  AppText, Button, Chip, ChipGroup, EmptyState, ErrorState, Fab, IconButton, LoadingState, Overline,
  Screen, SearchField, SegmentedControl, Sheet,
} from '../../components';
import { useSplitView } from '../../components/split-view';
import { strings } from '../../lib/strings';
import { dimensions, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { TaskCard } from '../dashboard/cards';
import { useGabineteDate } from '../dashboard/hooks';
import { useTaskPerson, useTasks } from './hooks';
import { TaskFilterFields, emptyFilters, type TaskFilters } from './task-filter-fields';

const copy = strings.tasks;
const scopes = [{ value: 'mine', label: copy.mine }, { value: 'all', label: copy.all }] satisfies [
  { value: 'mine'; label: string }, { value: 'all'; label: string },
];
const quickStatuses = [
  { value: '', label: copy.allStatuses },
  { value: 'ABERTA', label: strings.dashboard.open },
  { value: 'EM_ANDAMENTO', label: strings.dashboard.progress },
] satisfies { value: TaskFilters['status']; label: string }[];

type ListItem =
  | { kind: 'group'; key: string; title: string; count: number }
  | { kind: 'task'; key: string; task: Task };

function groupTasks(tasks: readonly Task[]): ListItem[] {
  const groups = [
    { title: strings.dashboard.overdue, key: 'overdue', tasks: tasks.filter((task) => task.isOverdue) },
    { title: copy.upcoming, key: 'upcoming', tasks: tasks.filter((task) => !task.isOverdue) },
  ];
  return groups.flatMap<ListItem>((group) => group.tasks.length ? [
    { kind: 'group', key: group.key, title: group.title, count: group.tasks.length },
    ...group.tasks.map((task): ListItem => ({ kind: 'task', key: `task-${task.id}`, task })),
  ] : []);
}

function TaskListCard({ task, mine, day, selected, onPress }: {
  task: Task; mine: boolean; day: string; selected: boolean; onPress: () => void;
}) {
  const { user } = useSession();
  const person = useTaskPerson(mine ? undefined : task.assigneeId);
  const assignee = mine ? undefined : (user?.id === task.assigneeId ? user.name : person.data?.name) ?? copy.personUnknown;
  return <TaskCard task={task} referenceDay={day} assignee={assignee} showRoutine selected={selected} onPress={onPress} />;
}

export function TaskListScreen({ selectedId }: { selectedId?: string } = {}) {
  const router = useRouter();
  const split = useSplitView();
  const day = useGabineteDate();
  const filtersButton = useRef<View>(null);
  const [mine, setMine] = useState(true);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({ ...emptyFilters, status: 'ABERTA' });
  const [draft, setDraft] = useState<TaskFilters>(emptyFilters);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const query = useTasks({ mine, ...filters, q }, day);
  const data = useMemo(() => {
    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    return groupTasks([...new Map(items.map((task) => [task.id, task])).values()]);
  }, [query.data]);

  const newTask = () => router.push('/tarefa/nova');
  const closeFilters = () => setFiltersVisible(false);
  const clearSearch = () => { setInput(''); setQ(''); setFilters(emptyFilters); };
  const openFilters = () => { setDraft(filters); setFiltersVisible(true); };
  const initialError = query.isError && !query.data;
  const empty = !query.isPending && !query.isError && data.length === 0;
  const header = (
    <View style={[styles.header, split && styles.splitHeader]}>
      <View style={styles.titleRow}>
        <AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{copy.title}</AppText>
        <IconButton ref={filtersButton} label={copy.filters} icon="sliders" onPress={openFilters} />
        {split && <Button label={copy.create} size="sm" icon="plus" onPress={newTask} />}
      </View>
      <SearchField label={copy.search} value={input} onChangeText={setInput} maxLength={100} submitLabel={strings.routines.searchAction} onSubmit={() => setQ(input.trim())} />
      <SegmentedControl label={copy.scope} options={scopes} value={mine ? 'mine' : 'all'} onChange={(scope) => setMine(scope === 'mine')} />
      <ChipGroup label={copy.filters} horizontal={!split}>
        {quickStatuses.map(({ value, label }) => (
          <Chip key={value} label={label} mode="radio" selected={filters.status === value} onPress={() => setFilters({ ...filters, status: value })} />
        ))}
        <Chip label={strings.dashboard.overdue} icon="alert-triangle" selected={filters.overdue} onPress={() => setFilters({ ...filters, overdue: !filters.overdue })} />
      </ChipGroup>
    </View>
  );

  return (
    <Screen>
      <FlashList
        data={data}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.kind}
        contentContainerStyle={[styles.list, split && styles.splitList]}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.kind === 'group' ? (
              <Overline>{query.hasNextPage ? item.title : strings.feedback.groupCount(item.title, item.count)}</Overline>
            ) : (
              <TaskListCard task={item.task} mine={mine} day={day} selected={item.task.id === selectedId}
                onPress={() => router.push({ pathname: '/tarefa/[id]', params: { id: item.task.id } })} />
            )}
          </View>
        )}
        ListEmptyComponent={query.isPending ? <LoadingState count={4} style={styles.skeletons} /> : initialError ? (
          <ErrorState retry={() => void query.refetch()} />
        ) : empty ? (
          <EmptyState message={copy.empty} description={copy.emptyHelp} actions={
            <View style={styles.actions}>
              <Button label={copy.clearFilters} variant="secondary" onPress={clearSearch} />
              {!split && <Button label={copy.create} icon="plus" onPress={newTask} />}
            </View>
          } />
        ) : null}
        ListFooterComponent={
          <View style={[styles.footer, !split && styles.fabClearance]}>
            {query.isError && !initialError && (
              <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />
            )}
            {query.hasNextPage && (
              <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />
            )}
          </View>
        }
      />
      {!split && !empty && !query.isPending && !query.isError && <Fab label={copy.create} onPress={newTask} />}
      <Sheet title={copy.filters} visible={filtersVisible} onDismiss={closeFilters} returnFocusRef={filtersButton}>
        <ScrollView style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
          <TaskFilterFields filters={draft} onChange={setDraft} />
          <View style={styles.actions}>
            <Button label={copy.clearFilters} variant="secondary" style={styles.filterAction} onPress={() => setDraft(emptyFilters)} />
            <Button label={copy.applyFilters} style={styles.filterAction} onPress={() => { setFilters(draft); closeFilters(); }} />
          </View>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: spacing.space4, paddingHorizontal: spacing.space4 },
  splitList: { paddingTop: spacing.space5 },
  header: { gap: spacing.space2, marginBottom: spacing.space2 },
  splitHeader: { gap: spacing.space3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.space2 },
  title: { flex: 1, minWidth: 0 },
  item: { paddingVertical: spacing.space3 / 2 },
  skeletons: { padding: 0 },
  footer: { gap: spacing.space3, paddingTop: spacing.space3, paddingBottom: spacing.space4 },
  fabClearance: { paddingBottom: dimensions.fab + spacing.space6 },
  filterScroll: { flexGrow: 0, flexShrink: 1 },
  filterContent: { gap: spacing.space5, padding: spacing.space1 },
  actions: { flexDirection: 'row', alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.space3 },
  filterAction: { flexGrow: 1, flexBasis: 0 },
});
