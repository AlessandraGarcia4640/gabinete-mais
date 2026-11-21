import { ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { guidelineVersionParamsSchema, userIdParamsSchema } from '@gabinete-plus/shared';
import {
  AppBar, Banner, Button, EmptyState, ErrorState, Icon, ListRow, LoadingState, MarkdownContent, Screen, Tag,
} from '../../components';
import { ListGroupItem } from '../../components/list-group';
import { strings } from '../../lib/strings';
import { iconSize, radius, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { guidelineError, useGuideline, useGuidelineHistory, useGuidelinesApi } from './hooks';
import { guidelineDate, guidelineTime } from './model';

const copy = strings.guidelines;

export function GuidelineHistoryScreen() {
  const params = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: params.id });
  const id = valid.success ? valid.data.id : undefined;
  const router = useRouter();
  const query = useGuidelineHistory(id);
  const entries = query.data?.pages.flatMap((page) => page.items) ?? [];
  const versions = [...new Map(entries.map((item) => [item.id, item])).values()];
  const current = versions[0];
  const firstError = query.isError && !query.data;
  function back() {
    if (router.canGoBack()) router.back();
    else if (id) router.replace({ pathname: '/orientacao/[id]', params: { id } });
    else router.replace('/orientacoes');
  }
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };

  return (
    <Screen>
      <AppBar title={copy.history} subtitle={current?.title} onBack={back} />
      <View style={styles.column}>
        <FlashList data={versions} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
          ListEmptyComponent={!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : firstError
            ? <ErrorState message={guidelineError(query.error)} retry={retry} /> : <EmptyState message={copy.emptyHistory} icon="clock" />}
          renderItem={({ item, index }) => {
            const title = copy.version(item.version);
            const latest = current?.id === item.id;
            return (
              <ListGroupItem first={index === 0} last={index === versions.length - 1}>
                <ListRow title={title}
                  accessibilityLabel={latest ? copy.currentVersionLabel(title) : title}
                  description={copy.historyMetadata(guidelineDate(item.createdAt), guidelineTime(item.createdAt), item.authorName)}
                  descriptionLines={1} start={<VersionIcon current={latest} />} end={latest && <Tag label={copy.current} />}
                  onPress={() => router.push({
                    pathname: '/orientacao/[id]/versao/[version]',
                    params: { id: item.guidelineId, version: String(item.version) },
                  })} />
              </ListGroupItem>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer}>
              {query.isError && !firstError && <ErrorState updating retry={retry} />}
              {query.hasNextPage && (
                <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                  disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />
              )}
            </View>
          } />
      </View>
    </Screen>
  );
}

function VersionIcon({ current }: { current: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.icon, { backgroundColor: current ? colors.brandSoft : colors.surfaceSunken }]}>
      <Icon name="file-text" size={iconSize.small} color={current ? 'brandText' : 'inkMuted'} />
    </View>
  );
}

export function GuidelineVersionScreen() {
  const params = useLocalSearchParams();
  const valid = guidelineVersionParamsSchema.safeParse({ id: params.id, version: params.version });
  const api = useGuidelinesApi();
  const { user } = useSession();
  const router = useRouter();
  const current = useGuideline(valid.success ? valid.data.id : undefined);
  const query = useQuery({
    queryKey: ['guideline-version', params.id, params.version, user?.id], enabled: valid.success && !!user,
    retry: false, queryFn: ({ signal }) => valid.success
      ? api.version(valid.data.id, valid.data.version, signal) : Promise.reject(new Error(copy.notFound)),
  });
  const entry = query.data;
  function back() {
    if (router.canGoBack()) router.back();
    else if (valid.success) router.replace({ pathname: '/orientacao/[id]/versoes', params: { id: valid.data.id } });
    else router.replace('/orientacoes');
  }
  const previous = (date: string, version: number) => current.data && current.data.version > version
    ? copy.previousVersion(date, current.data.version) : copy.versionRecorded(date);

  return (
    <Screen>
      <AppBar title={valid.success ? copy.version(valid.data.version) : copy.history} subtitle={entry?.title} onBack={back} />
      {!valid.success ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
        <ErrorState message={guidelineError(query.error)} retry={() => void query.refetch()} />
      ) : entry && (
        <ScrollView contentContainerStyle={styles.reading}>
          <Banner tone="info" message={previous(guidelineDate(entry.createdAt), entry.version)} />
          {current.isError && !current.data && <ErrorState updating retry={() => void current.refetch()} />}
          <MarkdownContent content={entry.content} />
          <Button label={copy.openCurrent} variant="secondary" onPress={() => {
            router.replace({ pathname: '/orientacao/[id]', params: { id: entry.guidelineId } });
          }} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  list: { padding: spacing.space4, paddingTop: spacing.space2 },
  footer: { gap: spacing.space3, paddingVertical: spacing.space3 },
  reading: { width: '100%', alignSelf: 'center', maxWidth: size.contentMax, padding: spacing.space4, gap: spacing.space6 },
  icon: {
    width: size.controlHeightSm, height: size.controlHeightSm, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
  },
});
