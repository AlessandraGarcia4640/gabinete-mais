import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppBar, AppText, Button, ErrorState, FooterBar, IconButton, LoadingState, Screen,
} from '../../components';
import { strings } from '../../lib/strings';
import { breakpoint, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { errorMessage, useGuideSection } from './hooks';
import { transitionRows } from './model';
import { TransitionList, TransitionSections, TransitionText } from './sections';

const copy = strings.transition;
type SectionQuery = ReturnType<typeof useGuideSection>;

function SectionContent({ query }: { query: SectionQuery }) {
  const router = useRouter();
  if (query.isPending) return <LoadingState />;
  if (query.isError && !query.data) return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  const entries = query.data?.pages.flatMap(({ section }) => transitionRows(section)) ?? [];
  const items = [...new Map(entries.map((item) => [item.id, item])).values()];
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };
  return (
    <>
      <TransitionList items={items} onOpen={(item) => router.push(item.href)} />
      {query.isError && <ErrorState updating retry={retry} />}
      {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
        disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
    </>
  );
}

function GuideText({ field, query }: { field: 'overview' | 'notes'; query: SectionQuery }) {
  const settings = query.data?.pages[0]?.settings;
  if (query.isPending) return <LoadingState />;
  if (query.isError && !settings) return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  return <TransitionText content={settings?.[field] ?? ''} />;
}

export function TransitionGuideScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const expanded = width >= breakpoint.expanded;
  const canCurate = user?.role === 'CHEFE';
  const routines = useGuideSection('ROUTINES');
  const guidelines = useGuideSection('GUIDELINES');
  const contacts = useGuideSection('CONTACTS');
  const tasks = useGuideSection('TASKS');
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/gabinete'); };
  const copies = () => router.push('/transicao/copias');
  const curate = () => router.push('/transicao/preparar');

  return (
    <Screen>
      {!expanded && <AppBar title={copy.title} onBack={back} action={<IconButton label={copy.copies} icon="layers" onPress={copies} />} />}
      <TransitionSections expanded={expanded} header={
        <>
          {expanded && <AppText variant="titleLg" accessibilityRole="header">{copy.title}</AppText>}
          <AppText variant="body" color="inkMuted">{copy.introduction}</AppText>
          {expanded && <View style={styles.actions}>
            <Button label={copy.copies} icon="layers" variant="secondary" onPress={copies} />
            {canCurate && <Button label={copy.curate} icon="edit-2" onPress={curate} />}
          </View>}
        </>
      } content={{
        overview: <GuideText field="overview" query={routines} />,
        routines: <SectionContent query={routines} />,
        guidelines: <SectionContent query={guidelines} />,
        contacts: <SectionContent query={contacts} />,
        tasks: <SectionContent query={tasks} />,
        notes: <GuideText field="notes" query={routines} />,
      }} />
      {!expanded && canCurate && <FooterBar><Button label={copy.curate} icon="edit-2" onPress={curate} /></FooterBar>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space3 },
});
