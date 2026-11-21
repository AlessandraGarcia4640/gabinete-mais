import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { routineFrequencySchema, type Routine } from '@gabinete-plus/shared';
import { Button, Chip, ChipGroup, EmptyState, ErrorState, Fab, Icon, ListGroup, ListRow, LoadingState, Screen, SearchField, Sheet } from '../../components';
import { strings } from '../../lib/strings';
import { dimensions, iconSize, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useGabineteDate } from '../dashboard/hooks';
import { displayDate } from '../dashboard/model';
import { useRoutineList } from './hooks';

const copy = strings.routines;
const scopes: readonly ('today' | 'all' | 'archived')[] = ['today', 'all', 'archived'];
type Group = Routine['frequency'] | 'specific';
const groupOrder: readonly Group[] = [...routineFrequencySchema.options, 'specific'];

function groupRoutines(routines: readonly Routine[]) {
  const groups = new Map<Group, Routine[]>();
  for (const routine of routines) {
    const group = routine.specificDate ? 'specific' : routine.frequency;
    const records = groups.get(group);
    if (records) records.push(routine);
    else groups.set(group, [routine]);
  }
  return groupOrder.flatMap((key) => {
    const records = groups.get(key);
    if (!records) return [];
    return [{ key, title: key === 'specific' ? copy.specificDate : copy.cadence[key], records }];
  });
}

function RoutineListRow({ routine, onPress }: { routine: Routine; onPress: () => void }) {
  const timing = routine.specificDate ? copy.dated(displayDate(routine.specificDate)) : undefined;
  const role = routine.defaultPosition && copy.positions[routine.defaultPosition];
  const subtitle = timing ?? role;
  return (
    <ListRow
      icon="repeat"
      title={routine.title}
      accessibilityLabel={routine.essentialForTransition ? copy.metadata(routine.title, copy.essential) : routine.title}
      description={subtitle ? copy.metadata(routine.category, subtitle) : routine.category}
      end={routine.essentialForTransition ? <Icon name="star" color="inkSubtle" size={iconSize.small} /> : undefined}
      onPress={onPress}
    />
  );
}

export function RoutineListScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useSession();
  const day = useGabineteDate();
  const canCreate = user?.role === 'CHEFE';
  const initialMode = params.scope === 'today' ? 'today' : 'all';
  const [mode, setMode] = useState<(typeof scopes)[number]>(initialMode);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [frequency, setFrequency] = useState<Routine['frequency'] | ''>('');
  const [showFrequency, setShowFrequency] = useState(false);
  const filterRef = useRef<View>(null);
  const query = useRoutineList(mode, day, q, frequency);
  const groups = useMemo(() => {
    const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
    return groupRoutines([...new Map(rows.map((routine) => [routine.id, routine])).values()]);
  }, [query.data]);
  const initialError = query.isError && !query.data;
  const selectFrequency = (selection: Routine['frequency'] | '') => {
    setFrequency(selection);
    setShowFrequency(false);
  };
  const header = (
    <View style={styles.header}>
      <SearchField label={copy.search} value={input} onChangeText={setInput} submitLabel={copy.searchAction} maxLength={100}
        onSubmit={() => setQ(input.trim())} />
      <ChipGroup label={copy.scope} horizontal>
        {scopes.map((item) => (
          <Chip key={item} mode="radio" label={copy[item]} selected={mode === item} onPress={() => setMode(item)} />
        ))}
        <Chip ref={filterRef} label={frequency ? strings.dashboard.frequency[frequency] : copy.frequency}
          context={frequency ? copy.frequency : undefined} selected={!!frequency} icon="sliders" onPress={() => setShowFrequency(true)} />
      </ChipGroup>
    </View>
  );
  return (
    <Screen>
      <View style={styles.column}>
        <FlashList
          data={groups}
          keyExtractor={(group) => group.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          renderItem={({ item }) => (
            <View style={styles.group}>
              <ListGroup label={query.hasNextPage ? item.title : strings.feedback.groupCount(item.title, item.records.length)}>
                {item.records.map((routine) => (
                  <RoutineListRow key={routine.id} routine={routine} onPress={() => router.push({ pathname: '/rotina/[id]', params: { id: routine.id } })} />
                ))}
              </ListGroup>
            </View>
          )}
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          ListEmptyComponent={query.isPending ? <LoadingState style={styles.loading} /> : initialError ? (
            <ErrorState retry={() => void query.refetch()} />
          ) : query.isError ? null : <EmptyState message={copy.empty} icon="repeat" />}
          ListFooterComponent={
            <View style={[styles.footer, canCreate && styles.fabClearance]}>
              {query.isError && !initialError && <ErrorState updating retry={() => {
                if (query.isFetchNextPageError) void query.fetchNextPage();
                else void query.refetch();
              }} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost"
                loading={query.isFetchingNextPage} disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
            </View>
          }
        />
      </View>
      {canCreate && <Fab label={copy.create} onPress={() => router.push('/rotina/nova')} />}
      <Sheet title={copy.frequency} visible={showFrequency} onDismiss={() => setShowFrequency(false)} returnFocusRef={filterRef}>
        <ScrollView>
          <ChipGroup label={copy.frequency} selection="radio">
            <Chip label={copy.allFrequencies} mode="radio" selected={frequency === ''} onPress={() => selectFrequency('')} />
            {routineFrequencySchema.options.map((value) => (
              <Chip key={value} label={strings.dashboard.frequency[value]} mode="radio" selected={frequency === value}
                onPress={() => selectFrequency(value)} />
            ))}
          </ChipGroup>
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  list: { paddingHorizontal: spacing.space4, paddingTop: spacing.space2 },
  header: { gap: spacing.space1, marginBottom: spacing.space3 },
  group: { paddingBottom: spacing.space6 },
  loading: { padding: 0 },
  footer: { gap: spacing.space3, paddingBottom: spacing.space4 },
  fabClearance: { paddingBottom: dimensions.fab + spacing.space6 },
});
