import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createGuidelineSchema, guidelineCategorySchema, userIdParamsSchema, type CreateGuideline, type Guideline } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Banner, Button, Card, EmptyState, ErrorState, FooterBar, Icon, ListRow, LoadingState,
  MarkdownContent, Screen, SegmentedControl, SelectField, Sheet, Switch, TextField,
} from '../../components';
import { DiscardDialog } from '../../components/discard-dialog';
import { Overlay } from '../../components/overlay';
import { strings } from '../../lib/strings';
import { dimensions, radius, size, spacing } from '../../lib/theme';
import { PreventFormRemoval } from '../../navigation/prevent-form-removal';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { guidelineError, useGuideline, useGuidelinesApi } from './hooks';

const copy = strings.guidelines;
type EditorMode = 'write' | 'preview';
const editorModes = [
  { value: 'write', label: copy.write },
  { value: 'preview', label: copy.preview },
] satisfies [{ value: EditorMode; label: string }, { value: EditorMode; label: string }];
const schema = createGuidelineSchema.extend({ essentialForTransition: z.boolean() });

export function GuidelineFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const { id: param } = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: param });
  const id = mode === 'edit' && valid.success ? valid.data.id : undefined;
  const { user } = useSession();
  const query = useGuideline(user?.role === 'CHEFE' ? id : undefined);
  const router = useRouter();
  let state = null;
  if (user?.role !== 'CHEFE') state = <EmptyState icon="lock" message={copy.forbidden} />;
  else if (mode === 'edit' && !id) state = <EmptyState message={copy.notFound} />;
  else if (mode === 'edit' && query.isPending) state = <LoadingState />;
  else if (mode === 'edit' && query.isError && !query.data) {
    state = <ErrorState message={guidelineError(query.error)} retry={() => void query.refetch()} />;
  }
  function cancel() {
    if (id) router.replace({ pathname: '/orientacao/[id]', params: { id } });
    else router.replace('/orientacoes');
  }
  if (state) return <Screen><AppBar title={mode === 'edit' ? copy.edit : copy.create} onBack={cancel} />{state}</Screen>;
  return <GuidelineForm key={id ?? 'new'} guideline={query.data} guardNavigation />;
}

function initialValues(guideline?: Guideline) {
  return {
    title: guideline?.title ?? '', category: guideline?.category ?? 'OUTROS',
    content: guideline?.content ?? '', essentialForTransition: guideline?.essentialForTransition ?? false,
  } satisfies CreateGuideline;
}

export function GuidelineForm({ guideline, guardNavigation = false }: { guideline?: Guideline; guardNavigation?: boolean }) {
  const [baseline] = useState(guideline);
  const [mode, setMode] = useState<EditorMode>('write');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const categoryRef = useRef<View>(null);
  const saveRef = useRef<View>(null);
  const cancelRef = useRef<View>(null);
  const approvedExit = useRef(false);
  const api = useGuidelinesApi();
  const manager = useSessionManager();
  const { user } = useSession();
  const client = useQueryClient();
  const router = useRouter();
  const { colors } = useTheme();
  const form = useForm<CreateGuideline>({ resolver: zodResolver(schema), defaultValues: initialValues(baseline) });
  const { isDirty, isSubmitting } = form.formState;
  const content = form.watch('content');
  const category = form.watch('category');
  useEffect(() => { if (!isDirty) approvedExit.current = false; }, [isDirty]);
  const save = useMutation({
    retry: false,
    mutationFn: (values: CreateGuideline) => baseline
      ? api.update(baseline.id, { ...values, expectedVersion: baseline.version }) : api.create(values),
  });
  const busy = save.isPending || isSubmitting;
  const modalOpen = categoryOpen || conflict || !!discard;
  function cancel() {
    if (baseline) router.replace({ pathname: '/orientacao/[id]', params: { id: baseline.id } });
    else router.replace('/orientacoes');
  }
  function attemptExit(proceed: () => void) {
    if (approvedExit.current) { proceed(); return; }
    if (busy) return;
    if (categoryOpen) { setCategoryOpen(false); return; }
    if (conflict) { setConflict(false); return; }
    if (isDirty) setDiscard(() => proceed);
    else proceed();
  }
  async function submit(values: CreateGuideline) {
    setMessage(null);
    try {
      const result = await save.mutateAsync(values);
      if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return;
      client.setQueryData(['guideline', result.id, user?.id], result);
      void Promise.all([
        client.invalidateQueries({ queryKey: ['guidelines'] }),
        client.invalidateQueries({ queryKey: ['guideline-versions', result.id] }),
      ]);
      form.reset(initialValues(result));
      approvedExit.current = true;
      router.replace({ pathname: '/orientacao/[id]', params: { id: result.id } });
    } catch (error) {
      const description = error instanceof Error ? guidelineError(error) : strings.contacts.requestError;
      if (description === copy.conflict) setConflict(true);
      else setMessage(description);
      if (baseline) void client.invalidateQueries({ queryKey: ['guideline', baseline.id] });
    }
  }
  function discardEdits(proceed: () => void) {
    approvedExit.current = true;
    form.reset();
    setConflict(false);
    setDiscard(null);
    proceed();
  }
  if (baseline?.isArchived) {
    return <Screen><AppBar title={copy.edit} onBack={cancel} /><EmptyState message={copy.archived} /></Screen>;
  }

  return (
    <Screen keyboard>
      <View style={styles.form} accessibilityElementsHidden={modalOpen} importantForAccessibility={modalOpen ? 'no-hide-descendants' : 'auto'}>
        <AppBar title={baseline ? copy.edit : copy.create} onBack={() => attemptExit(cancel)} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Controller name="title" control={form.control} render={({ field, fieldState }) => (
            <TextField ref={field.ref} label={copy.name} value={field.value} onBlur={field.onBlur} onChangeText={field.onChange}
              maxLength={200} editable={!busy} errorText={fieldState.error && copy.validation.title} />
          )} />
          <SelectField ref={categoryRef} label={copy.category} placeholder={copy.category} value={copy.categories[category]}
            disabled={busy} expanded={categoryOpen} onPress={() => setCategoryOpen(true)} />
          <View style={styles.editor}>
            <AppText variant="label" accessibilityRole="header">{copy.content}</AppText>
            <SegmentedControl<EditorMode> label={copy.contentMode} options={editorModes} value={mode} onChange={setMode} />
            {mode === 'write' ? (
              <Controller name="content" control={form.control} render={({ field, fieldState }) => (
                <TextField ref={field.ref} label={copy.content} hideLabel value={field.value} onBlur={field.onBlur}
                  onChangeText={field.onChange} multiline mono maxLength={24000} style={styles.markdownInput} editable={!busy}
                  help={copy.markdownHelp} errorText={fieldState.error && copy.validation.content} />
              )} />
            ) : (
              <Card>{content.trim() ? <MarkdownContent content={content} /> : <EmptyState message={copy.emptyContent} />}</Card>
            )}
          </View>
          <Controller name="essentialForTransition" control={form.control} render={({ field }) => (
            <Switch label={copy.essential} description={strings.routines.essentialHelp} checked={!!field.value}
              disabled={busy} onChange={field.onChange} />
          )} />
        </ScrollView>
        {!!message && <View style={styles.feedback}><Banner tone="danger" message={message} /></View>}
        <FooterBar>
          <Button ref={cancelRef} label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => attemptExit(cancel)} />
          <Button ref={saveRef} label={strings.routines.save} loading={busy} disabled={!!baseline && !isDirty}
            onPress={() => void form.handleSubmit(submit, () => setMode('write'))()} />
        </FooterBar>
      </View>
      <Sheet title={copy.category} visible={categoryOpen} returnFocusRef={categoryRef} onDismiss={() => setCategoryOpen(false)}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {guidelineCategorySchema.options.map((value) => (
            <ListRow key={value} title={copy.categories[value]} selection="radio" selected={category === value}
              onPress={() => {
                form.setValue('category', value, { shouldDirty: true });
                setCategoryOpen(false);
              }} />
          ))}
        </ScrollView>
      </Sheet>
      <Overlay title={copy.conflictTitle} visible={conflict} placement="dialog" returnFocusRef={saveRef}
        headerIcon={<View style={[styles.symbol, { backgroundColor: colors.accentSoft }]}>
          <Icon name="alert-triangle" color="statusAndamento" />
        </View>} onDismiss={() => setConflict(false)}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.conflictContent}>
          <AppText variant="body" color="inkMuted">{copy.conflictHelp}</AppText>
          <Button label={copy.reopen} icon="refresh-cw" onPress={() => discardEdits(cancel)} />
          <Button label={strings.routines.continueEditing} variant="secondary" onPress={() => setConflict(false)} />
        </ScrollView>
      </Overlay>
      <DiscardDialog visible={!!discard} returnFocusRef={cancelRef} onDismiss={() => setDiscard(null)}
        onDiscard={() => { if (discard) discardEdits(discard); }} />
      {guardNavigation && <PreventFormRemoval dirty={isDirty || busy || modalOpen} onAttempt={attemptExit} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, minHeight: 0 },
  content: { width: '100%', alignSelf: 'center', maxWidth: size.contentMax, padding: spacing.space4, gap: spacing.space5 },
  editor: { gap: spacing.space2 },
  markdownInput: { minHeight: dimensions.markdownEditor },
  feedback: { paddingHorizontal: spacing.space4, paddingBottom: spacing.space2 },
  symbol: { width: size.touchTarget, height: size.touchTarget, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  conflictContent: { gap: spacing.space3 },
});
