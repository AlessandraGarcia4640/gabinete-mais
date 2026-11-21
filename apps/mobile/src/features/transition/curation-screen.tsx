import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTransitionSnapshotSchema, updateTransitionSchema, type CreateTransitionSnapshot, type UpdateTransition } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Banner, Button, Card, Dialog, EmptyState, ErrorState, ListGroup, ListRow, LoadingState, Overline,
  Screen, TextField, type IconName,
} from '../../components';
import { DiscardDialog } from '../../components/discard-dialog';
import { strings } from '../../lib/strings';
import { size, spacing } from '../../lib/theme';
import { PreventFormRemoval } from '../../navigation/prevent-form-removal';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { errorMessage, useTransitionApi } from './hooks';

const copy = strings.transition;
type Settings = { overview: string; notes: string; revision: number };
const sources: { section: keyof typeof copy.sections; icon: IconName; href?: Href }[] = [
  { section: 'ROUTINES', icon: 'repeat', href: '/rotinas' },
  { section: 'GUIDELINES', icon: 'book-open', href: '/orientacoes' },
  { section: 'CONTACTS', icon: 'users', href: '/contatos' },
  { section: 'TASKS', icon: 'check-square' },
];

export function TransitionCuratorScreen() {
  const api = useTransitionApi();
  const { user } = useSession();
  const router = useRouter();
  const query = useQuery({
    queryKey: ['transition-curation', user?.id], enabled: user?.role === 'CHEFE', retry: false,
    queryFn: ({ signal }) => api.read({}, signal),
  });
  if (user?.role === 'CHEFE' && query.data) return <TransitionForm settings={query.data.settings} guardNavigation />;
  return (
    <Screen>
      <AppBar title={copy.curate} onBack={() => router.replace('/transicao')} />
      {user?.role !== 'CHEFE' ? <EmptyState icon="lock" message={copy.forbidden} /> : query.isPending ? <LoadingState />
        : query.isError && <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />}
    </Screen>
  );
}

function settingsValues(settings: Settings) {
  return { overview: settings.overview, notes: settings.notes, expectedRevision: settings.revision };
}

export function TransitionForm({ settings, guardNavigation = false }: { settings: Settings; guardNavigation?: boolean }) {
  const api = useTransitionApi();
  const manager = useSessionManager();
  const { user } = useSession();
  const client = useQueryClient();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pending, setPending] = useState<CreateTransitionSnapshot | null>(null);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const generateRef = useRef<View>(null);
  const cancelRef = useRef<View>(null);
  const approvedExit = useRef(false);
  const form = useForm<UpdateTransition>({ resolver: zodResolver(updateTransitionSchema), defaultValues: settingsValues(settings) });
  const snapshotForm = useForm<CreateTransitionSnapshot>({
    resolver: zodResolver(createTransitionSnapshotSchema), defaultValues: { title: '', expectedRevision: settings.revision },
  });
  const save = useMutation({ mutationFn: (input: UpdateTransition) => api.update(input), retry: false });
  const generate = useMutation({ mutationFn: (input: CreateTransitionSnapshot) => api.create(input), retry: false });
  const reload = useMutation({ mutationFn: () => api.read({}), retry: false });
  const dirty = form.formState.isDirty || snapshotForm.formState.isDirty;
  const busy = save.isPending || generate.isPending || reload.isPending || form.formState.isSubmitting || snapshotForm.formState.isSubmitting;
  const modalOpen = !!(pending || discard);
  const alive = () => manager.store.getState().status === 'authenticated' && manager.store.getState().user?.id === user?.id;
  const cancel = () => router.replace('/transicao');
  useEffect(() => { if (!dirty) approvedExit.current = false; }, [dirty]);
  function updateRevision(result: Settings) {
    form.reset(settingsValues(result));
    const title = snapshotForm.getValues('title');
    snapshotForm.reset({ title: '', expectedRevision: result.revision });
    if (title) snapshotForm.setValue('title', title, { shouldDirty: true });
  }
  async function submit(input: UpdateTransition) {
    setMessage(null);
    try {
      const result = await save.mutateAsync(input);
      if (!alive()) return;
      updateRevision(result);
      setMessage(copy.saved);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['transition-curation'] }), client.invalidateQueries({ queryKey: ['transition-guide'] }),
      ]);
    } catch (error) {
      setMessage(error instanceof Error ? errorMessage(error) : strings.contacts.requestError);
    }
  }
  async function snapshot(input: CreateTransitionSnapshot) {
    try {
      const result = await generate.mutateAsync(input);
      if (!alive()) return;
      void Promise.all([
        client.invalidateQueries({ queryKey: ['transition-copies'] }),
        client.invalidateQueries({ queryKey: ['transition-curation'] }),
        client.invalidateQueries({ queryKey: ['transition-guide'] }),
      ]);
      approvedExit.current = true;
      snapshotForm.reset({ title: '', expectedRevision: input.expectedRevision });
      setPending(null);
      router.replace({ pathname: '/transicao/copia/[id]', params: { id: result.id } });
    } catch (error) {
      const failure = error instanceof Error ? errorMessage(error) : strings.contacts.requestError;
      if (failure === copy.conflict) {
        setPending(null);
        setMessage(failure);
      } else setGenerationError(failure);
    }
  }
  async function reopen() {
    try {
      const fresh = await reload.mutateAsync();
      if (!alive()) return;
      updateRevision(fresh.settings);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? errorMessage(error) : strings.contacts.requestError);
    }
  }
  function attemptExit(proceed: () => void) {
    if (approvedExit.current) { proceed(); return; }
    if (busy) return;
    if (pending) { setPending(null); return; }
    if (dirty) setDiscard(() => proceed);
    else proceed();
  }

  return (
    <Screen keyboard>
      <View style={styles.form} accessibilityElementsHidden={modalOpen} importantForAccessibility={modalOpen ? 'no-hide-descendants' : 'auto'}>
        <AppBar title={copy.curate} onBack={() => attemptExit(cancel)} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Controller control={form.control} name="overview" render={({ field, fieldState }) => (
            <TextField ref={field.ref} label={copy.overview} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
              multiline maxLength={12000} help={copy.textLimit} editable={!busy} errorText={fieldState.error && copy.validation} />
          )} />
          <View style={styles.section}>
            <Overline>{copy.curation}</Overline>
            <AppText variant="label" color="inkMuted">{copy.curationHelp}</AppText>
            <ListGroup>
              {sources.map(({ section, icon, href }) => (
                <ListRow key={section} title={copy.sections[section]} description={copy.curationSources[section]} icon={icon}
                  onPress={href ? () => { if (!busy) router.push(href); } : undefined} />
              ))}
            </ListGroup>
          </View>
          <Controller control={form.control} name="notes" render={({ field, fieldState }) => (
            <TextField ref={field.ref} label={copy.notes} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
              multiline optional maxLength={12000} editable={!busy} errorText={fieldState.error && copy.validation} />
          )} />
          <Button label={copy.saveSettings} variant="secondary" loading={save.isPending} disabled={busy || !form.formState.isDirty}
            onPress={() => void form.handleSubmit(submit)()} />
          {!!message && <Banner tone={message === copy.saved ? 'success' : 'danger'} message={message} />}
          {message === copy.conflict && <Button label={copy.reopen} variant="secondary" loading={reload.isPending} disabled={busy}
            onPress={() => void reopen()} />}
          <Card flat>
            <AppText variant="heading" accessibilityRole="header">{copy.generate}</AppText>
            <AppText variant="label" color="inkMuted">{copy.copyHelp}</AppText>
            <Controller control={snapshotForm.control} name="title" render={({ field, fieldState }) => (
              <TextField ref={field.ref} label={copy.copyTitle} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
                maxLength={200} editable={!busy} errorText={fieldState.error && copy.validation} />
            )} />
            <Button ref={generateRef} label={copy.generate} icon="layers" disabled={busy || form.formState.isDirty}
              onPress={() => void snapshotForm.handleSubmit((values) => { setGenerationError(null); setPending(values); })()} />
          </Card>
          <Button ref={cancelRef} label={strings.routines.cancel} variant="ghost" disabled={busy} onPress={() => attemptExit(cancel)} />
        </ScrollView>
      </View>
      <Dialog title={copy.generateTitle} visible={!!pending} message={copy.copyHelp} intent="primary" error={generationError ?? undefined}
        busy={generate.isPending} confirmLabel={copy.confirmGeneration} dismissLabel={strings.routines.cancel} returnFocusRef={generateRef}
        onDismiss={() => setPending(null)} onConfirm={() => { if (pending) void snapshot(pending); }} />
      <DiscardDialog visible={!!discard} returnFocusRef={cancelRef} onDismiss={() => setDiscard(null)} onDiscard={() => {
        approvedExit.current = true;
        form.reset();
        snapshotForm.reset();
        setDiscard(null);
        discard?.();
      }} />
      {guardNavigation && <PreventFormRemoval dirty={dirty || busy || modalOpen} onAttempt={attemptExit} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, minHeight: 0 },
  content: { width: '100%', alignSelf: 'center', maxWidth: size.contentMax, padding: spacing.space4, gap: spacing.space5 },
  section: { gap: spacing.space3 },
});
