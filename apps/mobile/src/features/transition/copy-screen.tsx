import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { AppBar, AppText, Banner, EmptyState, ErrorState, LoadingState, MarkdownContent, Screen, Sheet, StatusBadge } from '../../components';
import { formatRecordDate } from '../../lib/date-time';
import { strings } from '../../lib/strings';
import { breakpoint, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { errorMessage, useTransitionApi } from './hooks';
import { transitionRows, type TransitionRow } from './model';
import { TransitionList, TransitionSections, TransitionText } from './sections';

const copy = strings.transition;

export function TransitionCopyScreen() {
  const params = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: params.id });
  const id = valid.success ? valid.data.id : undefined;
  return <TransitionCopy key={id} id={id} />;
}

function TransitionCopy({ id }: { id?: string }) {
  const api = useTransitionApi();
  const { user } = useSession();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selected, setSelected] = useState<TransitionRow | null>(null);
  const triggerRef = useRef<View>(null);
  const query = useQuery({
    queryKey: ['transition-copy', id, user?.id], enabled: !!id && !!user, retry: false,
    queryFn: ({ signal }) => api.get(id ?? '', signal),
  });
  const snapshot = query.data;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/transicao/copias'); };
  const open = (item: TransitionRow, trigger?: View) => {
    triggerRef.current = trigger ?? null;
    setSelected(item);
  };
  const reading = snapshot?.content;
  const metadata = snapshot && strings.routines.metadata(
    copy.generatedBy(formatRecordDate(snapshot.createdAt), snapshot.authorName), strings.guidelines.version(snapshot.version),
  );
  const details = selected?.details();

  return (
    <Screen>
      <View style={styles.main} accessibilityElementsHidden={!!selected} importantForAccessibility={selected ? 'no-hide-descendants' : 'auto'}>
        <AppBar title={snapshot?.title ?? copy.preservedCopy} subtitle={metadata} onBack={back} />
        {!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
          <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />
        ) : reading && (
          <TransitionSections expanded={width >= breakpoint.expanded}
            header={<Banner tone="info" icon="lock" message={copy.preserved} />}
            content={{
              overview: <TransitionText content={reading.overview} />,
              routines: <TransitionList items={transitionRows({ kind: 'ROUTINES', items: reading.routines, nextCursor: null })} onOpen={open} />,
              guidelines: <TransitionList items={transitionRows({ kind: 'GUIDELINES', items: reading.guidelines, nextCursor: null })} onOpen={open} />,
              contacts: <TransitionList items={transitionRows({ kind: 'CONTACTS', items: reading.contacts, nextCursor: null })} onOpen={open} />,
              tasks: <TransitionList items={transitionRows({ kind: 'TASKS', items: reading.tasks, nextCursor: null })} onOpen={open} />,
              notes: <TransitionText content={reading.notes} />,
            }} />
        )}
      </View>
      <Sheet title={selected?.title ?? copy.preservedCopy} visible={!!selected} returnFocusRef={triggerRef} onDismiss={() => setSelected(null)}>
        {selected && (
          <ScrollView contentContainerStyle={styles.details}>
            <AppText variant="label" color="inkMuted">{selected.description}</AppText>
            {selected.task && <StatusBadge status={selected.task.status} overdue={selected.task.isOverdue} />}
            {details ? <MarkdownContent content={details} /> : <AppText variant="body" color="inkMuted">{strings.contacts.noInformation}</AppText>}
          </ScrollView>
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, minHeight: 0 },
  details: { gap: spacing.space3 },
});
