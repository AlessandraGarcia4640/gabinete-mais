import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { guidelineCategorySchema, type Guideline } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Button, Card, Chip, ChipGroup, EmptyState, ErrorState, Fab, Icon, LoadingState, Screen, SearchField, Tag,
} from '../../components';
import { strings } from '../../lib/strings';
import { dimensions, iconSize, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { guidelineError, useGuidelines } from './hooks';
import { guidelineDate, guidelineExcerpt } from './model';

const copy = strings.guidelines;

export function GuidelineListScreen({ selectedId, pane = false }: { selectedId?: string; pane?: boolean } = {}) {
  const router = useRouter();
  const { user } = useSession();
  const [archived, setArchived] = useState(false);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<Guideline['category'] | ''>('');
  const query = useGuidelines(archived, q, category);
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = [...new Map(rows.map((item) => [item.id, item])).values()];
  const canCreate = user?.role === 'CHEFE';
  const firstError = query.isError && !query.data;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/gabinete'); };
  const create = () => router.push('/orientacao/nova');
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };

  return (
    <Screen keyboard>
      {pane ? (
        <View style={styles.paneHeader}>
          <AppText variant="titleLg" accessibilityRole="header" style={styles.paneTitle}>{copy.title}</AppText>
          {canCreate && <Button label={copy.createShort} icon="plus" size="sm" onPress={create} />}
        </View>
      ) : <AppBar title={copy.title} onBack={back} />}
      <View style={styles.column}>
        <FlashList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <View style={styles.filters}>
              <SearchField label={copy.search} value={input} onChangeText={setInput} maxLength={100}
                submitLabel={copy.searchAction} onSubmit={() => setQ(input.trim())} />
              <ChipGroup label={copy.category} horizontal>
                <Chip label={copy.allCategories} selected={!category} onPress={() => setCategory('')} />
                {guidelineCategorySchema.options.map((value) => (
                  <Chip key={value} label={copy.categories[value]} selected={category === value} onPress={() => setCategory(value)} />
                ))}
              </ChipGroup>
              <ChipGroup label={copy.listScope}>
                <Chip label={strings.contacts.active} selected={!archived} onPress={() => setArchived(false)} />
                <Chip label={strings.contacts.archived} selected={archived} onPress={() => setArchived(true)} />
              </ChipGroup>
            </View>
          }
          ItemSeparatorComponent={GuidelineCardSeparator}
          ListEmptyComponent={query.isPending ? <LoadingState /> : firstError
            ? <ErrorState message={guidelineError(query.error)} retry={retry} />
            : query.isError ? null : <EmptyState icon="book-open" message={copy.empty} />}
          renderItem={({ item }) => (
            <Card label={item.essentialForTransition ? copy.essentialRecord(item.title) : item.title}
              selected={pane ? selectedId === item.id : undefined}
              onPress={() => { if (selectedId !== item.id) router.push({ pathname: '/orientacao/[id]', params: { id: item.id } }); }}>
              <View style={styles.cardHeader}>
                <Tag label={copy.categories[item.category]} />
                {item.essentialForTransition && <Icon name="star" size={iconSize.small} />}
              </View>
              <AppText variant="heading">{item.title}</AppText>
              <AppText variant="label" color="inkMuted" numberOfLines={2}>{guidelineExcerpt(item.content)}</AppText>
              <View style={styles.metadata}>
                <Icon name="clock" size={iconSize.extraSmall} color="inkMuted" />
                <AppText variant="caption" color="inkMuted" style={styles.metadataText}>
                  {copy.listMetadata(copy.version(item.version), guidelineDate(item.updatedAt), item.authorName)}
                </AppText>
              </View>
            </Card>
          )}
          ListFooterComponent={
            <View style={[styles.footer, canCreate && !pane && styles.fabClearance]}>
              {query.isError && !firstError && <ErrorState updating retry={retry} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
            </View>
          }
        />
      </View>
      {canCreate && !pane && <Fab label={copy.create} onPress={create} />}
    </Screen>
  );
}

function GuidelineCardSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  paneHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.space4, paddingTop: spacing.space6, gap: spacing.space2 },
  paneTitle: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  content: { paddingHorizontal: spacing.space4, paddingTop: spacing.space2 },
  filters: { gap: spacing.space2, paddingBottom: spacing.space3 },
  separator: { height: spacing.space3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.space2 },
  metadata: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.space2 },
  metadataText: { flex: 1 },
  footer: { paddingVertical: spacing.space4, gap: spacing.space3 },
  fabClearance: { paddingBottom: dimensions.fab + spacing.space6 },
});
