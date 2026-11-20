import type { RefObject } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AppText, Avatar, Banner, Button, Card, EmptyState, ErrorState, Icon, ListRow, LoadingState, Sheet } from '../../components';
import { strings } from '../../lib/strings';
import { dimensions, iconSize, line, radius, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { useTasksApi } from './hooks';
import type { ResourceKind, ResourceOption } from './api';

const labels: Record<ResourceKind, string> = {
  person: strings.tasks.selectPerson, routine: strings.tasks.selectRoutine,
  contact: strings.tasks.selectContact, run: strings.tasks.selectRun,
};

interface ResourcePickerProps {
  kind: ResourceKind;
  assigneeId: string;
  routineId: string | null;
  onSelect: (option: ResourceOption) => void;
  onClose: () => void;
  onClear?: () => void;
  returnFocusRef?: RefObject<View | null>;
  visible?: boolean;
  confirmation?: {
    selectedId?: string;
    pending: boolean;
    error?: string;
    onConfirm: () => void;
  };
}

function SelectionMark({ selected }: { selected: boolean }) {
  const { colors } = useTheme();
  return (
    <View aria-hidden style={[styles.mark, {
      backgroundColor: selected ? colors.brand : colors.surface,
      borderColor: selected ? colors.brand : colors.borderStrong,
    }]}>
      {selected && <Icon name="check" size={iconSize.small} color="onBrand" />}
    </View>
  );
}

export function ResourcePicker({
  kind, assigneeId, routineId, onSelect, onClose, onClear, returnFocusRef, visible = true, confirmation,
}: ResourcePickerProps) {
  const { height } = useWindowDimensions();
  const { colors } = useTheme();
  const api = useTasksApi();
  const { user } = useSession();
  const query = useInfiniteQuery({
    queryKey: ['task-choices', kind, user?.id, assigneeId, routineId], enabled: !!user && visible,
    retry: false, initialPageParam: '',
    queryFn: ({ pageParam, signal }) => api.choices(kind, pageParam, assigneeId, routineId, signal),
    getNextPageParam: (page) => page.nextCursor || undefined,
  });
  const data = [...new Map((query.data?.pages.flatMap((page) => page.items) ?? []).map((item) => [item.id, item])).values()];
  const initialError = query.isError && !query.data;
  const rowHeight = dimensions.listRow + (kind === 'person' ? spacing.space3 : 0);
  const listHeight = Math.min(height / 2, (rowHeight + line.thin) * data.length + (query.hasNextPage || query.isError ? size.controlHeight : 0));
  const close = () => { if (!confirmation?.pending) onClose(); };
  return (
    <Sheet title={labels[kind]} visible={visible} onDismiss={close} returnFocusRef={returnFocusRef}>
      {kind === 'person' && <AppText variant="label" color="inkMuted">{strings.tasks.activePeople}</AppText>}
      {onClear && <Button label={strings.tasks.noLink} variant="secondary" onPress={onClear} />}
      {query.isPending && <LoadingState />}
      {initialError && <ErrorState retry={() => void query.refetch()} />}
      {!query.isPending && !query.isError && data.length === 0 && <EmptyState message={strings.tasks.selectionEmpty} />}
      {(data.length > 0 || (!initialError && query.isError) || query.hasNextPage) && (
        <Card style={[styles.listCard, { height: Math.max(listHeight, size.touchTarget) }]}>
          <View style={styles.list} role={confirmation ? 'radiogroup' : undefined} accessibilityLabel={labels[kind]}>
            <FlashList
              data={data}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              renderItem={({ item }) => {
                const role = item.role && strings.session.roles[item.role];
                const description = role && (item.id === user?.id ? strings.tasks.ownRole(role) : role);
                const selected = confirmation && item.id === (confirmation.selectedId ?? assigneeId);
                return <ListRow title={item.label} description={description} selection={confirmation ? 'radio' : undefined}
                  selected={selected} start={kind === 'person' ? <Avatar name={item.label} /> : undefined}
                  end={confirmation ? <SelectionMark selected={!!selected} /> : undefined}
                  onPress={() => { if (!confirmation?.pending) onSelect(item); }} />;
              }}
              ListFooterComponent={
                <View style={styles.pageActions}>
                  {query.isError && <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />}
                  {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}
                </View>
              }
            />
          </View>
        </Card>
      )}
      {!!confirmation?.error && <Banner tone="danger" message={confirmation.error} />}
      {confirmation && <Button label={strings.tasks.confirmAssign} disabled={!confirmation.selectedId || confirmation.selectedId === assigneeId}
        loading={confirmation.pending} onPress={confirmation.onConfirm} />}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  listCard: { padding: 0, flexShrink: 1 },
  list: { flex: 1, minHeight: 0 },
  pageActions: { gap: spacing.space2 },
  divider: { height: line.thin },
  mark: {
    width: iconSize.standard, height: iconSize.standard, borderWidth: line.strong, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
});
