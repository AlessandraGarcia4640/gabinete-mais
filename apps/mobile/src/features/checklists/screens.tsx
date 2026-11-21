import { AppText } from '../../components/app-text';
import { useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { Card } from '../../components/card';
import { Checkbox } from '../../components/checkbox';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { Button } from '../../components/button';
import { Choice } from '../../components/choice';
import { useRoutine } from '../routines/hooks';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { displayDate } from '../dashboard/model';
import { checklistError, useChecklistsApi, useMarkItem, useRun, useRuns, useTemplate } from './hooks';
import { ChecklistForm } from './form';
import { useStyles } from './styles';
export { ChecklistListScreen } from './list-screen';
export { ChecklistDetailScreen } from './detail-screen';
function identifier(value: string | string[] | undefined): string | undefined { const valid = userIdParamsSchema.safeParse({ id: value }); return valid.success ? valid.data.id : undefined; }
function Page<T extends { id: string }>({ data, query, header, empty, render }: { data: T[]; header: ReactElement; empty: string; render: (item: T) => ReactElement;
  query: { isPending: boolean; isError: boolean; isRefetching: boolean; isFetchingNextPage: boolean; hasNextPage: boolean; isFetchNextPageError: boolean; refetch: () => Promise<object>; fetchNextPage: () => Promise<object> } }) {
  const styles = useStyles();
  return <Screen>{query.isPending ? <View>{header}<LoadingState /></View> : query.isError && !data.length ? <View>{header}<ErrorState retry={() => void query.refetch()} /></View> :
    <FlashList data={[...new Map(data.map((item) => [item.id, item])).values()]} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={header} renderItem={({ item }) => render(item)}
      refreshing={query.isRefetching} onRefresh={() => void query.refetch()} ListEmptyComponent={<EmptyState message={empty} />}
      ListFooterComponent={<View style={styles.section}>{query.isError && <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />}
        {query.hasNextPage && <Button label={strings.feedback.loadMore} loading={query.isFetchingNextPage} disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}</View>} />}</Screen>;
}
export function ChecklistHistoryScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const templateId = identifier(params.templateId); const [mine, setMine] = useState(true); const query = useRuns(mine, templateId); const router = useRouter();
  return <Page query={query} data={query.data?.pages.flatMap((page) => page.items) ?? []} empty={strings.checklists.emptyRuns}
    header={<View style={styles.section}><View style={styles.choices}><Choice label={strings.checklists.mine} selected={mine} onPress={() => setMine(true)} /><Choice label={strings.checklists.allRuns} selected={!mine} onPress={() => setMine(false)} /></View></View>}
    render={(item) => <Card label={`${item.titleSnapshot} ${displayDate(item.periodStart)}`} onPress={() => router.push({ pathname: '/execucao/[id]', params: { id: item.id } })}>
      <AppText variant="bodyStrong" style={styles.label}>{item.titleSnapshot}</AppText><AppText variant="body">{item.routineTitleSnapshot}</AppText><AppText variant="body">{displayDate(item.periodStart)} · {strings.checklists.status[item.status]}</AppText><AppText variant="body">{strings.checklists.progress(item.completedItems, item.totalItems)}</AppText></Card>} />;
}
export function ChecklistRunScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const id = identifier(params.id); const query = useRun(id); const mark = useMarkItem(id); const { user } = useSession();
  if (!id) return <EmptyState message={strings.checklists.notFound} />;
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <View><AppText variant="caption" style={styles.error}>{checklistError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  const run = query.data; const editable = user?.role === 'CHEFE' || run.assigneeId === user?.id;
  return <Screen><FlashList data={run.items} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
    ListHeaderComponent={<View style={styles.section}><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{run.titleSnapshot}</AppText><AppText variant="body">{run.routineTitleSnapshot}</AppText><AppText variant="body">{displayDate(run.periodStart)} · {strings.checklists.version(run.templateVersion)}</AppText>
      <AppText variant="body">{strings.checklists.status[run.status]}</AppText><AppText variant="body" accessibilityLiveRegion="polite">{strings.checklists.progress(run.completedItems, run.totalItems)}</AppText>
      <AppText variant="body">{strings.checklists.snapshot}</AppText><AppText variant="body" style={styles.text}>{run.instructionsSnapshot}</AppText><AppText variant="body">{run.assigneeId === user?.id ? strings.checklists.owner : editable ? strings.checklists.chiefCanMark : strings.checklists.readOnly}</AppText>
      {mark.isError && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{checklistError(mark.error)}</AppText>}</View>}
    renderItem={({ item }) => <Card><Checkbox label={item.text} checked={item.isCompleted} disabled={!editable || mark.isPending || query.isRefetching} onChange={(done) => mark.mark(item.id, done)} />
      {item.completedById && item.completedAt && <MarkAuthor id={item.completedById} date={item.completedAt} />}</Card>} /></Screen>;
}
function MarkAuthor({ id, date }: { id: string; date: string }) {
  const styles = useStyles();
  const api = useChecklistsApi(); const { user } = useSession(); const person = useQuery({ queryKey: ['checklist-person', id, user?.id], enabled: !!user && user.id !== id, retry: false, queryFn: ({ signal }) => api.person(id, signal) });
  return <AppText variant="body" style={styles.text}>{strings.checklists.marked(user?.id === id ? user.name : person.data?.name ?? strings.checklists.personUnavailable, new Date(date).toLocaleString('pt-BR'))}</AppText>;
}
export function ChecklistFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const params = useLocalSearchParams(); const id = identifier(params.id); const { user } = useSession(); const query = useTemplate(mode === 'edit' && user?.role === 'CHEFE' ? id : undefined);
  const routineId = mode === 'create' ? identifier(params.routineId) : query.data?.routineId; const routine = useRoutine(user?.role === 'CHEFE' ? routineId : undefined); const router = useRouter();
  if (user?.role !== 'CHEFE') return <EmptyState message={strings.checklists.forbidden} />;
  if (mode === 'edit' && !id || mode === 'create' && !routineId) return <EmptyState message={strings.checklists.notFound} />;
  if (query.isError || routine.isError) return <ErrorState retry={() => { if (mode === 'edit' && id) void query.refetch(); if (routineId) void routine.refetch(); }} />;
  if (mode === 'edit' && query.isPending || routine.isPending) return <LoadingState />;
  if (query.data?.isArchived || routine.data?.isArchived) return <EmptyState message={strings.checklists.archivedError} />;
  if (!routine.data) return <EmptyState message={strings.checklists.notFound} />;
  return <ChecklistForm key={id ?? routineId} routine={routine.data} template={mode === 'edit' ? query.data : undefined} onSaved={(saved) => router.replace({ pathname: '/checklist/[id]', params: { id: saved.id } })}
    onCancel={() => { if (id) router.replace({ pathname: '/checklist/[id]', params: { id } }); else router.replace({ pathname: '/rotina/[id]', params: { id: routine.data.id } }); }} />;
}
