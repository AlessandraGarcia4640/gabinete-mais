import { AppText } from '../../components/app-text';
import { useState, type ReactElement } from 'react';
import { View } from 'react-native';
import { Card } from '../../components/card';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { Button } from '../../components/button';
import { AppBar } from '../../components/app-bar';
import { Choice } from '../../components/choice';
import { routineError, useRoutine } from '../routines/hooks';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { displayDate } from '../dashboard/model';
import { checklistError, useRuns, useTemplate } from './hooks';
import { ChecklistForm } from './form';
import { useStyles } from './styles';
export { ChecklistListScreen } from './list-screen';
export { ChecklistDetailScreen } from './detail-screen';
export { ChecklistRunScreen } from './run-screen';
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
export function ChecklistFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const copy = strings.checklists;
  const params = useLocalSearchParams();
  const id = mode === 'edit' ? identifier(params.id) : undefined;
  const { user } = useSession();
  const isChief = user?.role === 'CHEFE';
  const query = useTemplate(isChief ? id : undefined);
  const routineId = mode === 'create' ? identifier(params.routineId) : query.data?.routineId;
  const routine = useRoutine(isChief ? routineId : undefined);
  const router = useRouter();
  const returnToModels = () => router.replace('/checklists');
  const cancel = () => {
    if (id) router.replace({ pathname: '/checklist/[id]', params: { id } });
    else if (routineId) router.replace({ pathname: '/rotina/[id]', params: { id: routineId } });
    else returnToModels();
  };
  const stateScreen = (state: ReactElement) => (
    <Screen>
      <AppBar title={mode === 'create' ? copy.create : copy.edit} onBack={isChief ? cancel : returnToModels} />
      {state}
    </Screen>
  );
  if (!isChief) return stateScreen(
    <EmptyState icon="lock" message={copy.forbidden}
      actions={<Button label={copy.returnToModels} variant="secondary" onPress={returnToModels} />} />,
  );
  if (mode === 'edit' ? !id : !routineId) return stateScreen(<EmptyState message={copy.notFound} />);
  if (query.isError || routine.isError) return stateScreen(
    <ErrorState message={query.isError ? checklistError(query.error) : routine.isError ? routineError(routine.error) : undefined}
      retry={() => { if (query.isError) void query.refetch(); if (routine.isError) void routine.refetch(); }} />,
  );
  if ((mode === 'edit' && query.isPending) || routine.isPending) return stateScreen(<LoadingState />);
  if (query.data?.isArchived || routine.data?.isArchived) return stateScreen(<EmptyState message={copy.archivedError} />);
  if (!routine.data) return stateScreen(<EmptyState message={copy.notFound} />);
  return (
    <ChecklistForm key={id ?? routineId} guardNavigation routine={routine.data} template={query.data} onCancel={cancel}
      onSaved={(saved) => router.replace({ pathname: '/checklist/[id]', params: { id: saved.id } })} />
  );
}
