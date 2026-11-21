import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import {
  AppBar, Avatar, Button, Chip, ChipGroup, EmptyState, ErrorState, Fab, Icon, IconButton, ListRow, LoadingState,
  Screen, SearchField, Sheet, TextField,
} from '../../components';
import { ListGroupItem } from '../../components/list-group';
import { strings } from '../../lib/strings';
import { dimensions, iconSize, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useContacts } from './hooks';

const copy = strings.contacts;
const noDetails = { organization: '', tag: '' };

export function ContactListScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [archived, setArchived] = useState(false);
  const [keyOnly, setKeyOnly] = useState(false);
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [details, setDetails] = useState(noDetails);
  const [draft, setDraft] = useState(noDetails);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<View>(null);
  const query = useContacts({ ...details, q, archived, keyOnly });
  const rows = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = [...new Map(rows.map((contact) => [contact.id, contact])).values()];
  const canCreate = user?.role === 'CHEFE';
  const firstError = query.isError && !query.data;
  const filterCount = Number(!!details.organization) + Number(!!details.tag);
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/gabinete'); };
  const resetScope = () => { setArchived(false); setKeyOnly(false); };
  const clearFilters = () => {
    setInput('');
    setQ('');
    setDetails(noDetails);
    resetScope();
    setShowFilters(false);
  };

  return (
    <Screen keyboard>
      <AppBar title={copy.title} onBack={back} action={
        <IconButton ref={filterRef} label={filterCount ? copy.activeFilters(filterCount) : copy.filterLabel}
          icon="sliders" color={filterCount ? 'brandText' : undefined}
          onPress={() => { setDraft(details); setShowFilters(true); }} />
      } />
      <View style={styles.column}>
        <FlashList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled" refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
          ListHeaderComponent={
            <View style={styles.filters}>
              <SearchField label={copy.search} value={input} maxLength={100} onChangeText={setInput}
                submitLabel={copy.searchAction} onSubmit={() => setQ(input.trim())} />
              <ChipGroup label={copy.scope} horizontal>
                <Chip label={copy.all} selected={!archived && !keyOnly} onPress={resetScope} />
                <Chip label={copy.keyOnly} selected={keyOnly} icon="star" onPress={() => setKeyOnly(!keyOnly)} />
                <Chip label={copy.archived} selected={archived} onPress={() => setArchived(!archived)} />
              </ChipGroup>
            </View>
          }
          ListEmptyComponent={query.isPending ? <LoadingState style={styles.loading} /> : firstError
            ? <ErrorState retry={retry} /> : query.isError ? null : <EmptyState icon="users" message={copy.empty} />}
          renderItem={({ item, index }) => (
            <ListGroupItem first={index === 0} last={index === items.length - 1}>
              <ListRow title={item.name} accessibilityLabel={item.isKeyContact ? copy.keyRecord(item.name) : item.name}
                description={item.jobTitle ? strings.routines.metadata(item.organization, item.jobTitle) : item.organization}
                start={<Avatar name={item.name} />}
                end={item.isKeyContact && <Icon name="star" color="inkSubtle" size={iconSize.small} />}
                onPress={() => router.push({ pathname: '/contato/[id]', params: { id: item.id } })} />
            </ListGroupItem>
          )}
          ListFooterComponent={
            <View style={[styles.footer, canCreate && styles.fabClearance]}>
              {query.isError && !firstError && <ErrorState updating retry={retry} />}
              {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
                disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
            </View>
          }
        />
      </View>
      {canCreate && <Fab label={copy.create} onPress={() => router.push('/contato/novo')} />}
      <Sheet title={strings.tasks.filters} visible={showFilters} returnFocusRef={filterRef} onDismiss={() => setShowFilters(false)}>
        <ScrollView contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">
          <TextField label={copy.filterOrganization} value={draft.organization} maxLength={200}
            onChangeText={(organization) => setDraft({ ...draft, organization })} />
          <TextField label={copy.filterTag} value={draft.tag} maxLength={40} onChangeText={(tag) => setDraft({ ...draft, tag })} />
          <Button label={copy.applyFilters} onPress={() => {
            setDetails({ organization: draft.organization.trim(), tag: draft.tag.trim() });
            setQ(input.trim());
            setShowFilters(false);
          }} />
          <Button label={copy.clearFilters} variant="secondary" onPress={clearFilters} />
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  content: { paddingHorizontal: spacing.space4, paddingTop: spacing.space2 },
  filters: { gap: spacing.space3, paddingBottom: spacing.space3 },
  loading: { padding: 0 },
  footer: { gap: spacing.space3, paddingVertical: spacing.space4 },
  fabClearance: { paddingBottom: dimensions.fab + spacing.space6 },
});
