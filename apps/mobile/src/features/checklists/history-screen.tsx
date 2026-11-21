import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema, type ChecklistRun } from '@gabinete-plus/shared';
import { Button, Chip, ChipGroup, EmptyState, ErrorState, ListRow, LoadingState, Overline, Screen, StatusBadge } from '../../components';
import { ListGroupItem } from '../../components/list-group';
import { strings } from '../../lib/strings';
import { size, spacing } from '../../lib/theme';
import { useGabineteDate } from '../dashboard/hooks';
import { displayDate } from '../dashboard/model';
import { checklistError, useChecklistPersonName, useRuns } from './hooks';

const copy = strings.checklists;
type Entry = { kind: 'heading'; title: string } | { kind: 'run'; run: ChecklistRun; first: boolean; last: boolean };

function startOfWeek(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}

function historyEntries(runs: ChecklistRun[], today: string): Entry[] {
  const currentWeek = startOfWeek(today);
  const current: ChecklistRun[] = [];
  const others: ChecklistRun[] = [];
  for (const run of new Map(runs.map((entry) => [entry.id, entry])).values()) {
    const group = startOfWeek(run.periodStart) === currentWeek ? current : others;
    group.push(run);
  }
  const groupEntries = (title: string, group: ChecklistRun[]): Entry[] => group.length > 0 ? [
    { kind: 'heading', title },
    ...group.map((run, index): Entry => ({ kind: 'run', run, first: index === 0, last: index === group.length - 1 })),
  ] : [];
  return [...groupEntries(copy.currentWeek, current), ...groupEntries(copy.otherRunDates, others)];
}

function parseId(value: string | string[] | undefined) {
  const valid = userIdParamsSchema.safeParse({ id: value });
  return valid.success ? valid.data.id : undefined;
}

function RunRow({ entry, mine, open }: {
  entry: Extract<Entry, { kind: 'run' }>; mine: boolean; open: (run: ChecklistRun) => void;
}) {
  const { run, first, last } = entry;
  const name = useChecklistPersonName(mine ? undefined : run.assigneeId);
  const date = displayDate(run.periodStart);
  const description = mine ? run.titleSnapshot : strings.routines.metadata(run.titleSnapshot, name);
  const fraction = run.status === 'EM_ANDAMENTO' ? copy.progressFraction(run.completedItems, run.totalItems) : undefined;
  const status = fraction ? strings.routines.metadata(copy.status[run.status], copy.progress(run.completedItems, run.totalItems)) : copy.status[run.status];
  return (
    <ListGroupItem first={first} last={last}>
      <ListRow title={date} titleVariant="data" description={description} descriptionLines={mine ? 1 : 2} icon="list"
        accessibilityLabel={copy.runRecord(date, description, status)}
        end={<StatusBadge status={run.status} label={fraction} />} onPress={() => open(run)} />
    </ListGroupItem>
  );
}

export function ChecklistHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [mine, setMine] = useState(true);
  const day = useGabineteDate();
  const query = useRuns(mine, parseId(params.templateId), parseId(params.routineId));
  const entries = historyEntries(query.data?.pages.flatMap((page) => page.items) ?? [], day);
  const firstError = query.isError && !query.data;
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };

  return (
    <Screen>
      <View style={styles.column}>
        <FlashList data={entries} keyExtractor={(entry) => entry.kind === 'heading' ? entry.title : entry.run.id}
          getItemType={(entry) => entry.kind} contentContainerStyle={styles.content}
          refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <ChipGroup label={copy.runScope} selection="radio">
              <Chip label={copy.mine} mode="radio" selected={mine} onPress={() => setMine(true)} />
              <Chip label={copy.allRuns} mode="radio" selected={!mine} onPress={() => setMine(false)} />
            </ChipGroup>
          }
          ListEmptyComponent={query.isPending ? <LoadingState /> : firstError
            ? <ErrorState message={checklistError(query.error)} retry={retry} /> : <EmptyState icon="list" message={copy.emptyRuns} />}
          renderItem={({ item }) => item.kind === 'heading' ? (
            <View style={styles.heading}><Overline>{item.title}</Overline></View>
          ) : (
            <RunRow entry={item} mine={mine} open={(run) => router.push({ pathname: '/execucao/[id]', params: { id: run.id } })} />
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {query.isError && !firstError && <ErrorState updating retry={retry} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  content: { paddingHorizontal: spacing.space4, paddingTop: spacing.space2, paddingBottom: spacing.space4 },
  heading: { paddingTop: spacing.space4, paddingBottom: spacing.space3 },
  footer: { gap: spacing.space3, paddingTop: spacing.space6 },
});
