import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Routine } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Banner, Button, Card, Dialog, EmptyState, ErrorState, FooterBar, IconButton, KeyValueList,
  ListGroup, ListRow, LoadingState, MarkdownContent, Screen, Section, Tag,
} from '../../components';
import { strings } from '../../lib/strings';
import { NumberedText } from '../../components/numbered-text';
import { size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { checklistError, useTemplates } from '../checklists/hooks';
import { displayDate } from '../dashboard/model';
import { routineError, useRoutine, useRoutinesApi } from './hooks';

const copy = strings.routines;

function Steps({ items }: { items: Routine['steps'] }) {
  return (
    <Section title={copy.steps}>
      <Card>
        {items.length ? items.map((text, index) => (
          <NumberedText key={index} position={index + 1} text={text} accessibilityLabel={copy.stepDescription(index, text)} />
        )) : <AppText variant="body" color="inkMuted">{copy.noSteps}</AppText>}
      </Card>
    </Section>
  );
}

function RoutineContent({ routine, canManage }: { routine: Routine; canManage: boolean }) {
  const router = useRouter();
  const templates = useTemplates(false, routine.id);
  const records = [...new Map((templates.data?.pages.flatMap((page) => page.items) ?? []).map((template) => [template.id, template])).values()];
  const firstError = templates.isError && !templates.data;
  const primaryModel = !routine.isArchived && !templates.isPending && !templates.isError && !templates.hasNextPage
    && records.length === 1 ? records[0] : undefined;
  const frequency = strings.dashboard.frequency[routine.frequency];
  const facts = [
    { label: copy.category, value: routine.category },
    { label: copy.frequency, value: frequency },
    { label: copy.defaultPosition, value: routine.defaultPosition ? copy.positions[routine.defaultPosition] : copy.noPosition },
    ...(routine.specificDate ? [{ label: copy.specificDate, value: displayDate(routine.specificDate), data: true }] : []),
    ...(routine.frequencyDetails ? [{ label: copy.frequencyDetails, value: routine.frequencyDetails }] : []),
  ];
  const openTemplate = (id: string) => router.push({ pathname: '/checklist/[id]', params: { id } });
  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <View style={styles.tags}>
            <Tag label={frequency} icon="repeat" />
            {routine.essentialForTransition && <Tag label={copy.essential} icon="star" tone="neutral" />}
          </View>
          <AppText variant="titleLg" accessibilityRole="header">{routine.title}</AppText>
          {!!routine.description && <AppText variant="body" color="inkMuted">{routine.description}</AppText>}
        </View>
        {routine.isArchived && <Banner tone="neutral" message={copy.archivedLabel} />}
        <Card><KeyValueList items={facts} /></Card>
        <Steps items={routine.steps} />
        <Section title={copy.instructions}>
          <Card>{routine.instructions ? <MarkdownContent content={routine.instructions} /> :
            <AppText variant="body" color="inkMuted">{copy.noInstructions}</AppText>}</Card>
        </Section>
        <Section title={copy.checklistSection}>
          {templates.isPending && <LoadingState style={styles.loading} />}
          {firstError && <ErrorState message={checklistError(templates.error)} retry={() => void templates.refetch()} />}
          {!templates.isPending && !templates.isError && records.length === 0 && <EmptyState icon="list" message={strings.checklists.empty} />}
          <ListGroup>
            {records.map((template) => (
              <ListRow key={template.id} title={template.title} icon="list"
                description={strings.checklists.modelSummary(strings.checklists.version(template.version), strings.checklists.itemCount(template.items.length))}
                onPress={() => openTemplate(template.id)} />
            ))}
            <ListRow title={strings.checklists.history} icon="clock"
              onPress={() => router.push({ pathname: '/execucoes', params: { routineId: routine.id } })} />
          </ListGroup>
          {templates.isError && !firstError && (
            <ErrorState updating retry={() => { if (templates.isFetchNextPageError) void templates.fetchNextPage(); else void templates.refetch(); }} />
          )}
          {templates.hasNextPage && (
            <Button label={strings.feedback.loadMore} variant="ghost" loading={templates.isFetchingNextPage}
              disabled={templates.isRefetching} onPress={() => void templates.fetchNextPage()} />
          )}
          <View style={styles.links}>
            <Button label={copy.allChecklistModels} variant="ghost"
              onPress={() => router.push({ pathname: '/checklists', params: { routineId: routine.id } })} />
            {canManage && <Button label={strings.checklists.create} icon="plus" variant="ghost"
              onPress={() => router.push({ pathname: '/checklist/nova', params: { routineId: routine.id } })} />}
          </View>
        </Section>
      </ScrollView>
      {primaryModel && <FooterBar>
        <Button label={copy.startTodayChecklist} icon="play" onPress={() => openTemplate(primaryModel.id)} />
      </FooterBar>}
    </>
  );
}

export function RoutineDetail({ id }: { id?: string }) {
  const query = useRoutine(id);
  const { user } = useSession();
  const api = useRoutinesApi();
  const router = useRouter();
  const client = useQueryClient();
  const archiveRef = useRef<View>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string>();
  const archive = useMutation({
    retry: false,
    mutationFn: () => api.archive(id ?? ''),
    onSuccess: async () => {
      setConfirm(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['routines'] }),
        client.invalidateQueries({ queryKey: ['routine', id] }),
      ]);
    },
    onError: (failure) => {
      setError(routineError(failure));
      void client.invalidateQueries({ queryKey: ['routine', id] });
    },
  });
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/rotinas'); };
  const routine = query.data;
  const canManage = user?.role === 'CHEFE' && !!routine && !routine.isArchived;
  const actions = canManage && routine && (
    <View style={styles.tags}>
      <IconButton label={copy.edit} icon="edit-2" disabled={archive.isPending}
        onPress={() => router.push({ pathname: '/rotina/[id]/editar', params: { id: routine.id } })} />
      <IconButton ref={archiveRef} label={copy.archive} icon="archive" disabled={archive.isPending}
        onPress={() => { setError(undefined); setConfirm(true); }} />
    </View>
  );
  return (
    <Screen>
      <AppBar title={copy.details} onBack={back} action={actions} />
      {!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
        <ErrorState message={routineError(query.error)} retry={() => void query.refetch()} />
      ) : <RoutineContent routine={query.data} canManage={canManage} />}
      <Dialog title={copy.archiveTitle} visible={confirm} message={copy.archiveDescription} error={error}
        confirmLabel={copy.confirmArchive} dismissLabel={copy.cancel} busy={archive.isPending}
        returnFocusRef={archiveRef} onDismiss={() => setConfirm(false)} onConfirm={() => { if (canManage) archive.mutate(); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', gap: spacing.space6, padding: spacing.space4 },
  intro: { gap: spacing.space3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.space2 },
  loading: { padding: 0 },
});
