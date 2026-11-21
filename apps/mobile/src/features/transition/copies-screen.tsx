import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { AppBar, AppText, Button, EmptyState, ErrorState, Icon, ListRow, LoadingState, Screen } from '../../components';
import { ListGroupItem } from '../../components/list-group';
import { formatRecordDate } from '../../lib/date-time';
import { strings } from '../../lib/strings';
import { iconSize, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { errorMessage, useTransitionApi } from './hooks';

const copy = strings.transition;

export function TransitionCopiesScreen() {
  const api = useTransitionApi();
  const { user } = useSession();
  const router = useRouter();
  const query = useInfiniteQuery({
    queryKey: ['transition-copies', user?.id], enabled: !!user, retry: false, initialPageParam: '',
    queryFn: ({ pageParam, signal }) => api.list(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor || undefined,
  });
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const copies = [...new Map(rows.map((row) => [row.id, row])).values()];
  const firstError = query.isError && !query.data;
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/transicao'); };
  return (
    <Screen>
      <AppBar title={copy.copies} onBack={back} />
      <View style={styles.column}>
        <FlashList data={copies} keyExtractor={(item) => item.id} contentContainerStyle={styles.list}
          ListEmptyComponent={query.isPending ? <LoadingState /> : firstError
            ? <ErrorState message={errorMessage(query.error)} retry={retry} /> : <EmptyState message={copy.noCopies} icon="layers" />}
          renderItem={({ item, index }) => (
            <ListGroupItem first={index === 0} last={index === copies.length - 1}>
              <ListRow title={item.title} icon="layers" descriptionLines={1}
                description={strings.routines.metadata(copy.generatedBy(formatRecordDate(item.createdAt), item.authorName), strings.guidelines.version(item.version))}
                onPress={() => router.push({ pathname: '/transicao/copia/[id]', params: { id: item.id } })} />
            </ListGroupItem>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {query.isError && !firstError && <ErrorState updating retry={retry} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
              {query.data && <View style={styles.immutable}>
                <Icon name="lock" color="inkMuted" size={iconSize.extraSmall} />
                <AppText variant="caption" color="inkMuted" style={styles.message}>{copy.immutable}</AppText>
              </View>}
            </View>
          } />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  list: { padding: spacing.space4, paddingTop: spacing.space2 },
  footer: { gap: spacing.space3, paddingVertical: spacing.space6 },
  immutable: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
  message: { flexShrink: 1 },
});
