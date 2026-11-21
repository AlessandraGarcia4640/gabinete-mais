import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { AppText, Button, Chip, ChipGroup, EmptyState, ErrorState, Icon, ListRow, LoadingState, Screen } from '../../components';
import { ListGroupItem } from '../../components/list-group';
import { strings } from '../../lib/strings';
import { iconSize, size, spacing } from '../../lib/theme';
import { useTemplates } from './hooks';

const copy = strings.checklists;

export function ChecklistListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsed = userIdParamsSchema.safeParse({ id: params.routineId });
  const routineId = parsed.success ? parsed.data.id : undefined;
  const [archived, setArchived] = useState(false);
  const query = useTemplates(archived, routineId);
  const data = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = [...new Map(data.map((item) => [item.id, item])).values()];
  const firstError = query.isError && !query.data;
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };

  return (
    <Screen>
      <View style={styles.column}>
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <View style={styles.filters}>
              <ChipGroup label={copy.modelScope} selection="radio">
                <Chip label={copy.active} mode="radio" selected={!archived} onPress={() => setArchived(false)} />
                <Chip label={copy.archived} mode="radio" selected={archived} onPress={() => setArchived(true)} />
              </ChipGroup>
            </View>
          }
          ListEmptyComponent={query.isPending ? <LoadingState style={styles.loading} /> : firstError
            ? <ErrorState retry={retry} /> : <EmptyState icon="list" message={copy.empty} />}
          renderItem={({ item, index }) => (
            <ListGroupItem first={index === 0} last={index === items.length - 1}>
              <ListRow title={item.title} icon="list" description={copy.modelSummary(copy.version(item.version), copy.itemCount(item.items.length))}
                onPress={() => router.push({ pathname: '/checklist/[id]', params: { id: item.id } })} />
            </ListGroupItem>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              {query.isError && !firstError && <ErrorState updating retry={retry} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
              <View style={styles.note}>
                <Icon name="info" color="inkMuted" size={iconSize.extraSmall} />
                <AppText variant="caption" color="inkMuted" style={styles.noteText}>{copy.createFromRoutine}</AppText>
              </View>
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
  filters: { paddingBottom: spacing.space4 },
  loading: { padding: 0 },
  footer: { gap: spacing.space3, paddingTop: spacing.space6 },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
  noteText: { flex: 1 },
});
