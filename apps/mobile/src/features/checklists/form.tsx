import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChecklistTemplate, Routine } from '@gabinete-plus/shared';
import { AppBar, AppText, Banner, Button, FooterBar, ListGroup, ListRow, OrderedEditor, Screen, TextField } from '../../components';
import { DiscardDialog } from '../../components/discard-dialog';
import { strings } from '../../lib/strings';
import { size, spacing } from '../../lib/theme';
import { PreventFormRemoval } from '../../navigation/prevent-form-removal';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { checklistError, useChecklistsApi } from './hooks';
import { templateChanges, templateFormSchema, templatePayload, type ChecklistFormValues } from './model';

const copy = strings.checklists;

interface ChecklistFormProps {
  routine: Routine;
  template?: ChecklistTemplate;
  onSaved: (template: ChecklistTemplate) => void;
  onCancel: () => void;
  guardNavigation?: boolean;
}

export function ChecklistForm({ routine, template, onSaved, onCancel, guardNavigation = false }: ChecklistFormProps) {
  const [baseline] = useState(template);
  const [message, setMessage] = useState<string | null>(null);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const cancelRef = useRef<View>(null);
  const approvedExit = useRef(false);
  const api = useChecklistsApi();
  const client = useQueryClient();
  const { user } = useSession();
  const manager = useSessionManager();
  const form = useForm<ChecklistFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      routineId: routine.id,
      title: baseline?.title ?? routine.title,
      items: (baseline?.items ?? (routine.steps.length ? routine.steps : [''])).map((text) => ({ text })),
    },
  });
  const { isDirty, isSubmitting, errors } = form.formState;
  useEffect(() => { if (!isDirty) approvedExit.current = false; }, [isDirty]);
  const items = useFieldArray({ control: form.control, name: 'items' });
  const save = useMutation({
    retry: false,
    mutationFn: (values: ChecklistFormValues) => {
      const payload = templatePayload(values);
      if (!baseline) return api.create(payload);
      const changes = templateChanges(baseline, payload);
      return changes ? api.update(baseline.id, changes) : Promise.resolve(null);
    },
  });
  const busy = save.isPending || isSubmitting;

  async function submit(values: ChecklistFormValues) {
    setMessage(null);
    try {
      const saved = await save.mutateAsync(values);
      if (!saved) { setMessage(strings.routines.noChanges); return; }
      if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return;
      form.reset({ routineId: saved.routineId, title: saved.title, items: saved.items.map((text) => ({ text })) });
      client.setQueryData(['checklist-template', saved.id, user?.id], saved);
      void client.invalidateQueries({ queryKey: ['checklist-templates'] });
      approvedExit.current = true;
      onSaved(saved);
    } catch (error) {
      setMessage(error instanceof Error ? checklistError(error) : strings.routines.requestError);
    }
  }

  function attemptExit(proceed: () => void) {
    if (approvedExit.current) { proceed(); return; }
    if (busy) return;
    if (isDirty) setDiscard(() => proceed);
    else proceed();
  }

  function discardChanges() {
    approvedExit.current = true;
    form.reset();
    setMessage(null);
    setDiscard(null);
    discard?.();
  }

  return (
    <Screen keyboard>
      <View style={styles.form} accessibilityElementsHidden={!!discard} importantForAccessibility={discard ? 'no-hide-descendants' : 'auto'}>
        <AppBar title={baseline ? copy.edit : copy.create} onBack={() => attemptExit(onCancel)} />
        <View style={styles.column}>
          <FlashList data={items.fields} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.fields}>
                {baseline && <Banner message={copy.nextVersion(baseline.version)} />}
                <ListGroup>
                  <ListRow title={routine.title} icon="repeat"
                    description={strings.routines.metadata(copy.routineLabel, strings.dashboard.frequency[routine.frequency])} />
                </ListGroup>
                <Controller control={form.control} name="title" render={({ field, fieldState }) => (
                  <TextField ref={field.ref} label={copy.name} value={field.value} onChangeText={field.onChange}
                    onBlur={field.onBlur} editable={!busy} errorText={fieldState.error && copy.invalidTitle} />
                )} />
                <AppText variant="label" accessibilityRole="header">{copy.items}</AppText>
              </View>
            }
            renderItem={({ index }) => (
              <View style={styles.item}>
                <OrderedEditor position={index + 1}
                  field={<Controller control={form.control} name={`items.${index}.text`} render={({ field, fieldState }) => (
                    <TextField ref={field.ref} label={copy.item(index)} hideLabel value={field.value} multiline
                      onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} style={styles.itemField}
                      errorText={fieldState.error && copy.invalidItems} />
                  )} />}
                  up={{ label: copy.up(index), disabled: busy || index === 0, onPress: () => items.move(index, index - 1) }}
                  down={{ label: copy.down(index), disabled: busy || index === items.fields.length - 1, onPress: () => items.move(index, index + 1) }}
                  remove={{ label: copy.remove(index), disabled: busy, onPress: () => items.remove(index) }}
                />
              </View>
            )}
            ListFooterComponent={
              <View style={styles.fields}>
                <Button label={copy.add} icon="plus" variant="ghost" disabled={busy || items.fields.length >= 100}
                  onPress={() => items.append({ text: '' })} />
                {errors.items && (items.fields.length === 0 || errors.items.message)
                  ? <AppText variant="caption" color="danger" role="alert">{copy.invalidItems}</AppText>
                  : <AppText variant="caption" color="inkMuted">{copy.itemLimits}</AppText>}
              </View>
            }
          />
        </View>
        {!!message && (
          <View style={styles.feedback}>
            <Banner tone={message === strings.routines.noChanges ? 'neutral' : 'danger'} message={message} />
          </View>
        )}
        <FooterBar>
          <Button ref={cancelRef} label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => attemptExit(onCancel)} />
          <Button label={strings.routines.save} loading={busy} disabled={!!baseline && !isDirty} onPress={() => void form.handleSubmit(submit)()} />
        </FooterBar>
      </View>
      <DiscardDialog visible={!!discard} onDismiss={() => setDiscard(null)} returnFocusRef={cancelRef} onDiscard={discardChanges} />
      {guardNavigation && <PreventFormRemoval dirty={isDirty || busy} onAttempt={attemptExit} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, minHeight: 0 },
  column: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: size.contentMax },
  content: { padding: spacing.space4 },
  fields: { gap: spacing.space5, paddingBottom: spacing.space2 },
  item: { paddingBottom: spacing.space2 },
  itemField: { minHeight: size.touchTarget, paddingHorizontal: spacing.space2, borderWidth: 0 },
  feedback: { paddingHorizontal: spacing.space4, paddingBottom: spacing.space2 },
});
