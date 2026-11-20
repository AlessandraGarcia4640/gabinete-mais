import { AppText } from '../../components/app-text';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routineFrequencySchema, userIdParamsSchema, type Routine } from '@gabinete-plus/shared';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { Button } from '../../components/button';
import { TextField } from '../../components/text-field';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback';
import { RoutineCard } from '../dashboard/cards';
import { displayDate } from '../dashboard/model';
import { useGabineteDate } from '../dashboard/hooks';
import { routineError, useRoutine, useRoutineList, useRoutinesApi } from './hooks';
import { Choice } from '../../components/choice';
import { RoutineForm } from './form';
export function RoutineListScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const router = useRouter(); const { user } = useSession(); const day = useGabineteDate();
  const [mode, setMode] = useState<'all' | 'today' | 'archived'>(params.scope === 'today' ? 'today' : 'all');
  const [input, setInput] = useState(''); const [q, setQ] = useState(''); const [frequency, setFrequency] = useState<Routine['frequency'] | ''>('');
  const query = useRoutineList(mode, day, q, frequency);
  const data = useMemo(() => [...new Map((query.data?.pages.flatMap((page) => page.items) ?? []).map((routine) => [routine.id, routine])).values()], [query.data]);
  const header = <View style={styles.header}>
    {user?.role === 'CHEFE' && <Button label={strings.routines.create} onPress={() => router.push('/rotina/nova')} />}
    <TextField label={strings.routines.search} value={input} onChangeText={setInput} maxLength={100} returnKeyType="search" onSubmitEditing={() => setQ(input.trim())} />
    <Button label={strings.routines.searchAction} secondary onPress={() => setQ(input.trim())} />
    <View style={styles.choices}>{(['all', 'today', 'archived'] satisfies ('all' | 'today' | 'archived')[]).map((value) => <Choice key={value} label={strings.routines[value]} selected={mode === value} onPress={() => setMode(value)} />)}</View>
    <View style={styles.choices}><Choice label={strings.routines.allFrequencies} selected={frequency === ''} onPress={() => setFrequency('')} />
      {routineFrequencySchema.options.map((value) => <Choice key={value} label={strings.dashboard.frequency[value]} selected={frequency === value} onPress={() => setFrequency(value)} />)}</View>
  </View>;
  return <Screen>
    {query.isPending ? <View>{header}<LoadingState /></View> : query.isError && !query.data ? <View>{header}<ErrorState retry={() => void query.refetch()} /></View> : <FlashList data={data} keyExtractor={(routine) => routine.id} contentContainerStyle={styles.content}
      ListHeaderComponent={header} renderItem={({ item }) => <RoutineCard routine={item} onPress={() => router.push({ pathname: '/rotina/[id]', params: { id: item.id } })} />}
      refreshing={query.isRefetching} onRefresh={() => void query.refetch()} ListEmptyComponent={query.isError ? null : <EmptyState message={strings.routines.empty} />}
      ListFooterComponent={<View style={styles.footer}>{query.isError && <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />}
        {query.hasNextPage && <Button label={query.isFetchingNextPage ? strings.feedback.loadingMore : strings.feedback.loadMore} loading={query.isFetchingNextPage} disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}</View>} />}
  </Screen>;
}
export function RoutineDetailScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); const id = valid.success ? valid.data.id : undefined;
  const query = useRoutine(id); const { user } = useSession(); const api = useRoutinesApi(); const router = useRouter(); const client = useQueryClient();
  const [confirm, setConfirm] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const archive = useMutation({ retry: false, mutationFn: () => api.archive(id ?? ''), onSuccess: async () => {
    setConfirm(false); await Promise.all([client.invalidateQueries({ queryKey: ['routines'] }), client.invalidateQueries({ queryKey: ['routine', id] })]);
  }, onError: (error) => { setMessage(routineError(error)); void client.invalidateQueries({ queryKey: ['routine', id] }); } });
  if (!valid.success) return <EmptyState message={strings.routines.notFound} />;
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <View><AppText variant="caption" style={styles.error}>{routineError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  const routine = query.data;
  const header = <View style={styles.header}><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{routine.title}</AppText>
    <AppText variant="body" style={styles.text}>{routine.category} · {strings.dashboard.frequency[routine.frequency]}</AppText>
    {routine.isArchived && <AppText variant="caption" style={styles.error}>{strings.routines.archivedLabel}</AppText>}
    <AppText variant="bodyStrong" style={styles.label}>{strings.routines.description}</AppText><AppText variant="body" style={styles.text}>{routine.description}</AppText>
    <AppText variant="bodyStrong" style={styles.label}>{strings.routines.instructions}</AppText><AppText variant="body" style={styles.text}>{routine.instructions}</AppText>
    <AppText variant="bodyStrong" style={styles.label}>{strings.routines.frequencyDetails}</AppText><AppText variant="body" style={styles.text}>{routine.frequencyDetails}</AppText>
    {routine.specificDate && <AppText variant="body" style={styles.text}>{strings.routines.specificDate}: {displayDate(routine.specificDate)}</AppText>}
    <AppText variant="body" style={styles.text}>{strings.routines.defaultPosition}: {routine.defaultPosition ? strings.routines.positions[routine.defaultPosition] : strings.routines.noPosition}</AppText>
    <AppText variant="body" style={styles.text}>{strings.routines.essential}: {routine.essentialForTransition ? strings.routines.yes : strings.routines.no}</AppText>
    <Button label={strings.checklists.models} secondary onPress={() => router.push({ pathname: '/checklists', params: { routineId: routine.id } })} />
    {user?.role === 'CHEFE' && !routine.isArchived && <Button label={strings.checklists.create} onPress={() => router.push({ pathname: '/checklist/nova', params: { routineId: routine.id } })} />}
    <AppText variant="bodyStrong" style={styles.label}>{strings.routines.steps}</AppText></View>;
  return <Screen><FlashList data={routine.steps.map((text, index) => ({ text, index }))} keyExtractor={(step) => String(step.index)} contentContainerStyle={styles.content}
    ListHeaderComponent={header} renderItem={({ item }) => <View style={styles.step}><AppText variant="bodyStrong" style={styles.label}>{strings.routines.step(item.index)}</AppText><AppText variant="body" style={styles.text}>{item.text}</AppText></View>}
    ListEmptyComponent={<AppText variant="body">{strings.routines.noSteps}</AppText>}
    ListFooterComponent={<View style={styles.footer}>{!!message && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{message}</AppText>}
      {user?.role === 'CHEFE' && !routine.isArchived && <><Button label={strings.routines.edit} disabled={archive.isPending} onPress={() => router.push({ pathname: '/rotina/[id]/editar', params: { id: routine.id } })} />
        {!confirm ? <Button label={strings.routines.archive} secondary onPress={() => { setMessage(null); setConfirm(true); }} /> : <View style={styles.footer}>
          <AppText variant="bodyStrong" style={styles.label}>{strings.routines.archiveTitle}</AppText><AppText variant="body" style={styles.text}>{strings.routines.archiveDescription}</AppText>
          <Button label={archive.isPending ? strings.routines.archiving : strings.routines.confirmArchive} loading={archive.isPending} onPress={() => archive.mutate()} />
          <Button label={strings.routines.cancel} secondary disabled={archive.isPending} onPress={() => setConfirm(false)} /></View>}</>}
    </View>} /></Screen>;
}
export function RoutineFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const styles = useStyles();
  const { user } = useSession(); const router = useRouter(); const params = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: params.id }); const id = mode === 'edit' && valid.success ? valid.data.id : undefined;
  const query = useRoutine(user?.role === 'CHEFE' ? id : undefined);
  if (user?.role !== 'CHEFE') return <EmptyState message={strings.routines.forbidden} />;
  if (mode === 'edit' && !valid.success) return <EmptyState message={strings.routines.notFound} />;
  if (mode === 'edit' && query.isPending) return <LoadingState />;
  if (mode === 'edit' && query.isError) return <View><AppText variant="caption" style={styles.error}>{routineError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  if (mode === 'edit' && query.data?.isArchived) return <EmptyState message={strings.routines.archivedError} />;
  return <RoutineForm key={id ?? 'new'} routine={mode === 'edit' ? query.data : undefined}
    onSaved={(routine) => router.replace({ pathname: '/rotina/[id]', params: { id: routine.id } })}
    onCancel={() => { if (id) router.replace({ pathname: '/rotina/[id]', params: { id } }); else router.replace('/rotinas'); }} />;
}
const useStyles = createThemedStyles((theme) => ({ content: { padding: 20 }, header: { gap: 16, paddingBottom: 20 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, title: { color: theme.colors.ink }, label: { color: theme.colors.ink },
  text: { color: theme.colors.inkMuted }, error: { color: theme.colors.danger, padding: 16 }, footer: { paddingVertical: 20, gap: 16 }, step: { marginBottom: 20, gap: 8 } }));
