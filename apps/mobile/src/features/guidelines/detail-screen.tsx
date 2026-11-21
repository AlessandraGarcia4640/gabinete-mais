import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Banner, Button, Dialog, EmptyState, ErrorState, Icon, IconButton, ListGroup, ListRow,
  LoadingState, MarkdownContent, Screen, Sheet, Tag, type IconName,
} from '../../components';
import { useSplitView } from '../../components/split-view';
import { formatRecordDate } from '../../lib/date-time';
import { strings } from '../../lib/strings';
import { iconSize, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { guidelineError, useGuideline, useGuidelinesApi } from './hooks';

const copy = strings.guidelines;

export function GuidelineDetailScreen() {
  const { id: param } = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: param });
  const id = valid.success ? valid.data.id : undefined;
  return <GuidelineDetail key={id} id={id} />;
}

function GuidelineDetail({ id }: { id?: string }) {
  const query = useGuideline(id);
  const api = useGuidelinesApi();
  const client = useQueryClient();
  const { user } = useSession();
  const router = useRouter();
  const split = useSplitView();
  const [overlay, setOverlay] = useState<'actions' | 'archive'>();
  const actionsRef = useRef<View>(null);
  const archive = useMutation({
    retry: false,
    mutationFn: () => api.archive(id ?? ''),
    onSuccess: async () => {
      setOverlay(undefined);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['guideline', id] }),
        client.invalidateQueries({ queryKey: ['guidelines'] }),
      ]);
    },
  });
  const guideline = query.data;
  const canManage = user?.role === 'CHEFE' && guideline && !guideline.isArchived;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/orientacoes'); };
  const edit = () => { if (id) router.push({ pathname: '/orientacao/[id]/editar', params: { id } }); };
  const history = () => { if (id) router.push({ pathname: '/orientacao/[id]/versoes', params: { id } }); };
  const more = canManage && (
    <IconButton ref={actionsRef} label={copy.moreActions} icon="more-vertical" disabled={archive.isPending}
      onPress={() => { archive.reset(); setOverlay('actions'); }} />
  );

  return (
    <Screen>
      {!split && <AppBar title={copy.detail} onBack={back} action={canManage && (
        <View style={styles.actions}><IconButton label={copy.edit} icon="edit-2" onPress={edit} />{more}</View>
      )} />}
      {!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
        <ErrorState message={guidelineError(query.error)} retry={() => void query.refetch()} />
      ) : guideline && (
        <ScrollView contentContainerStyle={[styles.content, split && styles.pane]}>
          {split && <View style={[styles.actions, styles.paneActions]}>
            <Button label={copy.history} icon="clock" variant="ghost" size="sm" onPress={history} />
            {canManage && <Button label={copy.edit} icon="edit-2" variant="secondary" size="sm" onPress={edit} />}
            {more}
          </View>}
          {guideline.isArchived && <Banner tone="neutral" message={copy.archived} />}
          <View style={styles.identity}>
            <View style={styles.wrap}>
              <Tag label={copy.categories[guideline.category]} />
              {guideline.essentialForTransition && <Tag label={copy.essential} icon="star" tone="neutral" />}
            </View>
            <AppText variant="titleLg" accessibilityRole="header" selectable>{guideline.title}</AppText>
            <View style={styles.wrap}>
              <Metadata icon="clock" value={copy.version(guideline.version)} />
              <Metadata icon="calendar" value={formatRecordDate(guideline.updatedAt)} />
              <Metadata icon="user" value={guideline.authorName} />
            </View>
          </View>
          <MarkdownContent content={guideline.content} />
          {!split && <ListGroup>
            <ListRow title={copy.history} description={copy.versionCount(guideline.version)} icon="clock" onPress={history} />
          </ListGroup>}
        </ScrollView>
      )}
      <Sheet title={copy.moreActions} visible={overlay === 'actions'} returnFocusRef={actionsRef} onDismiss={() => setOverlay(undefined)}>
        <Button label={copy.archive} icon="archive" variant="dangerGhost" onPress={() => setOverlay('archive')} />
      </Sheet>
      <Dialog title={copy.archiveTitle} visible={overlay === 'archive'} message={copy.archiveHelp}
        error={archive.isError ? guidelineError(archive.error) : undefined} confirmLabel={copy.confirmArchive}
        dismissLabel={strings.routines.cancel} busy={archive.isPending} returnFocusRef={actionsRef}
        onDismiss={() => setOverlay(undefined)} onConfirm={() => { if (canManage) archive.mutate(); }} />
    </Screen>
  );
}

function Metadata({ icon, value }: { icon: IconName; value: string }) {
  return <View style={styles.metadata}>
    <Icon name={icon} color="inkMuted" size={iconSize.extraSmall} />
    <AppText variant="caption" color="inkMuted" style={styles.metadataText}>{value}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.space1 },
  paneActions: { justifyContent: 'flex-end' },
  content: { width: '100%', alignSelf: 'center', maxWidth: size.contentMax, padding: spacing.space4, gap: spacing.space6 },
  pane: { padding: spacing.space8 },
  identity: { gap: spacing.space3 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 },
  metadata: { flexDirection: 'row', alignItems: 'center', gap: spacing.space1, maxWidth: '100%' },
  metadataText: { flexShrink: 1 },
});
