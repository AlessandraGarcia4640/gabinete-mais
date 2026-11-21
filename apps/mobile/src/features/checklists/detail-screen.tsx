import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Banner, Button, Card, Dialog, EmptyState, ErrorState, Icon, IconButton, ListGroup, ListRow,
  LoadingState, Screen, Section, Tag, TextField,
} from '../../components';
import { Control } from '../../components/control';
import { ListGroupItem } from '../../components/list-group';
import { NumberedText } from '../../components/numbered-text';
import { strings } from '../../lib/strings';
import { iconSize, radius, size, spacing } from '../../lib/theme';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { gabineteDate } from '../dashboard/model';
import { useRoutine } from '../routines/hooks';
import { checklistError, useChecklistsApi, useTemplate } from './hooks';
import { dateInput, startFormSchema, startPayload } from './model';

const copy = strings.checklists;

export function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id });
  return <ChecklistDetail key={valid.success ? valid.data.id : undefined} id={valid.success ? valid.data.id : undefined} />;
}

function ChecklistDetail({ id }: { id?: string }) {
  const query = useTemplate(id);
  const template = query.data;
  const routine = useRoutine(template?.routineId);
  const api = useChecklistsApi();
  const { user } = useSession();
  const manager = useSessionManager();
  const router = useRouter();
  const client = useQueryClient();
  const archiveRef = useRef<View>(null);
  const [confirm, setConfirm] = useState(false);
  const today = gabineteDate();
  const form = useForm({ resolver: zodResolver(startFormSchema), defaultValues: { date: dateInput(today) } });
  const date = form.watch('date').trim();
  const start = useMutation({
    retry: false,
    mutationFn: (value: { date: string }) => api.start(id ?? '', startPayload(value.date)),
    onSuccess: (run) => {
      if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return;
      client.setQueryData(['checklist-run', run.id, user?.id], run);
      void client.invalidateQueries({ queryKey: ['checklist-runs'] });
      router.push({ pathname: '/execucao/[id]', params: { id: run.id } });
    },
  });
  const archive = useMutation({
    retry: false,
    mutationFn: () => api.archive(id ?? ''),
    onSuccess: async () => {
      setConfirm(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['checklist-template', id] }),
        client.invalidateQueries({ queryKey: ['checklist-templates'] }),
      ]);
    },
  });
  const blocked = template?.isArchived || routine.data?.isArchived;
  const busy = start.isPending || archive.isPending || form.formState.isSubmitting;
  const canEdit = user?.role === 'CHEFE' && !!template && !!routine.data && !blocked;
  const canArchive = user?.role === 'CHEFE' && !!template && !template.isArchived;
  const items = template?.items.map((text, index) => ({ text, index })) ?? [];
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/checklists'); };
  const routineLabel = routine.data ? strings.routines.metadata(routine.data.title, strings.dashboard.frequency[routine.data.frequency])
    : strings.routines.details;

  return (
    <Screen keyboard>
      <AppBar title={copy.detail} onBack={back} action={(canEdit || canArchive) && (
        <View style={styles.actions}>
          {canEdit && <IconButton label={copy.edit} icon="edit-2" disabled={busy}
            onPress={() => router.push({ pathname: '/checklist/[id]/editar', params: { id: template.id } })} />}
          {canArchive && <IconButton ref={archiveRef} label={copy.archive} icon="archive" disabled={busy}
            onPress={() => { archive.reset(); setConfirm(true); }} />}
        </View>
      )} />
      {!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
        <ErrorState message={checklistError(query.error)} retry={() => void query.refetch()} />
      ) : template && (
        <View style={styles.column}>
          <FlashList data={items} keyExtractor={(item) => String(item.index)} contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.header}>
                <View>
                  <View style={styles.metadata}>
                    <View><Tag label={copy.version(template.version)} /></View>
                    <Control accessibilityRole="link" accessibilityLabel={routineLabel} style={styles.routine}
                      onPress={() => router.push({ pathname: '/rotina/[id]', params: { id: template.routineId } })}>
                      <Icon name="repeat" size={iconSize.small} color="inkMuted" />
                      <AppText variant="caption" color="inkMuted" style={styles.routineLabel}>{routineLabel}</AppText>
                    </Control>
                  </View>
                  <AppText variant="titleLg" accessibilityRole="header">{template.title}</AppText>
                </View>
                {blocked && <Banner tone="neutral" message={template.isArchived ? copy.archivedLabel : copy.archivedError} />}
                {!blocked && routine.isPending && <LoadingState style={styles.loading} />}
                {!blocked && routine.isError && <ErrorState message={checklistError(routine.error)} retry={() => void routine.refetch()} />}
                {!blocked && !!routine.data && (
                  <Card>
                    <AppText variant="heading" accessibilityRole="header">{copy.start}</AppText>
                    <Controller control={form.control} name="date" render={({ field, fieldState }) => (
                      <TextField ref={field.ref} label={copy.date} placeholder={strings.routines.datePlaceholder}
                        value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} mono
                        help={copy.startHelp} errorText={fieldState.error && strings.routines.validation.specificDate} />
                    )} />
                    {start.isError && <Banner tone="danger" message={checklistError(start.error)} />}
                    <Button label={date === dateInput(today) || date === today ? copy.startToday : copy.start} icon="play"
                      loading={start.isPending} disabled={busy} onPress={() => void form.handleSubmit((value) => start.mutate(value))()} />
                  </Card>
                )}
                <Section title={copy.items} description={copy.snapshotHelp} />
              </View>
            }
            renderItem={({ item }) => (
              <ListGroupItem first={item.index === 0} last={item.index === items.length - 1}>
                <View style={[styles.item, item.index === 0 && styles.firstItem, item.index === items.length - 1 && styles.lastItem]}>
                  <NumberedText position={item.index + 1} text={item.text} accessibilityLabel={copy.itemDescription(item.index, item.text)} />
                </View>
              </ListGroupItem>
            )}
            ListFooterComponent={
              <View style={styles.footer}>
                <ListGroup>
                  <ListRow title={copy.history} icon="clock"
                    onPress={() => router.push({ pathname: '/execucoes', params: { templateId: template.id } })} />
                </ListGroup>
              </View>
            }
          />
        </View>
      )}
      <Dialog title={copy.archive} visible={confirm} message={copy.archiveHelp}
        error={archive.isError ? checklistError(archive.error) : undefined} confirmLabel={copy.confirmArchive}
        dismissLabel={strings.routines.cancel} busy={archive.isPending} returnFocusRef={archiveRef}
        onDismiss={() => setConfirm(false)} onConfirm={() => { if (canArchive) archive.mutate(); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.space1 },
  column: { flex: 1, width: '100%', maxWidth: size.contentMax, alignSelf: 'center' },
  content: { paddingHorizontal: spacing.space4, paddingBottom: spacing.space4 },
  header: { gap: spacing.space6, paddingBottom: spacing.space3 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2, alignItems: 'center' },
  routine: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2, minHeight: size.touchTarget, minWidth: 0, flexShrink: 1, borderRadius: radius.sm },
  routineLabel: { flexShrink: 1 },
  loading: { padding: 0 },
  item: { paddingHorizontal: spacing.space4, paddingVertical: spacing.space1 },
  firstItem: { paddingTop: spacing.space4 },
  lastItem: { paddingBottom: spacing.space4 },
  footer: { paddingTop: spacing.space6 },
});
