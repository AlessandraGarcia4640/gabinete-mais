import { AppText } from '../../components/app-text';
import { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChecklistTemplate, Routine } from '@gabinete-plus/shared';
import { Button } from '../../components/button';
import { TextField } from '../../components/text-field';
import { strings } from '../../lib/strings';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { checklistError, useChecklistsApi } from './hooks';
import { templateChanges, templateFormSchema, templatePayload, type ChecklistFormValues } from './model';
import { useStyles } from './styles';
export function ChecklistForm({ routine, template, onSaved, onCancel }: { routine: Routine; template?: ChecklistTemplate; onSaved: (template: ChecklistTemplate) => void; onCancel: () => void }) {
  const styles = useStyles();
  const [baseline] = useState(template); const [message, setMessage] = useState<string | null>(null); const [discard, setDiscard] = useState(false);
  const api = useChecklistsApi(); const client = useQueryClient(); const { user } = useSession(); const manager = useSessionManager();
  const form = useForm<ChecklistFormValues>({ resolver: zodResolver(templateFormSchema), defaultValues: { routineId: routine.id, title: baseline?.title ?? routine.title, items: (baseline?.items ?? (routine.steps.length ? routine.steps : [''])).map((text) => ({ text })) } });
  const dirty = form.formState.isDirty; const items = useFieldArray({ control: form.control, name: 'items' });
  const save = useMutation({ retry: false, mutationFn: (values: ChecklistFormValues) => {
    const payload = templatePayload(values); if (!baseline) return api.create(payload);
    const changes = templateChanges(baseline, payload); return changes ? api.update(baseline.id, changes) : Promise.resolve(null);
  } });
  async function submit(values: ChecklistFormValues) {
    setMessage(null);
    try {
      const saved = await save.mutateAsync(values); if (!saved) { setMessage(strings.routines.noChanges); return; }
      if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return;
      client.setQueryData(['checklist-template', saved.id, user?.id], saved); void client.invalidateQueries({ queryKey: ['checklist-templates'] }); onSaved(saved);
    } catch (error) { setMessage(error instanceof Error ? checklistError(error) : strings.routines.requestError); }
  }
  const busy = save.isPending || form.formState.isSubmitting;
  return <Screen keyboard>
    <FlashList data={items.fields} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={styles.section}><AppText variant="titleLg" style={styles.title}>{routine.title}</AppText><Controller control={form.control} name="title" render={({ field, fieldState }) => <TextField label={strings.checklists.name} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} errorText={fieldState.error ? strings.checklists.invalidTitle : undefined} />} /><AppText variant="bodyStrong" style={styles.label}>{strings.checklists.items}</AppText></View>}
      renderItem={({ index }) => <View style={styles.section}><Controller control={form.control} name={`items.${index}.text`} render={({ field, fieldState }) => <TextField label={strings.checklists.item(index)} value={field.value} multiline onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} errorText={fieldState.error ? strings.checklists.invalidItems : undefined} />} />
        <Button label={strings.checklists.up(index)} variant="secondary" disabled={busy || index === 0} onPress={() => items.move(index, index - 1)} />
        <Button label={strings.checklists.down(index)} variant="secondary" disabled={busy || index === items.fields.length - 1} onPress={() => items.move(index, index + 1)} />
        <Button label={strings.checklists.remove(index)} variant="secondary" disabled={busy} onPress={() => items.remove(index)} /></View>}
      ListFooterComponent={<View style={styles.section}><Button label={strings.checklists.add} variant="secondary" disabled={busy || items.fields.length >= 100} onPress={() => items.append({ text: '' })} />
        {!!form.formState.errors.items && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{strings.checklists.invalidItems}</AppText>}
        {!!message && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{message}</AppText>}
        <Button label={strings.routines.save} loading={busy} disabled={!!baseline && !dirty} onPress={() => void form.handleSubmit(submit)()} />
        <Button label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => { if (dirty) setDiscard(true); else onCancel(); }} />
        {discard && <><AppText variant="body">{strings.routines.unsavedTitle}</AppText><Button label={strings.routines.discard} onPress={onCancel} /><Button label={strings.routines.continueEditing} variant="secondary" onPress={() => setDiscard(false)} /></>}
      </View>} />
  </Screen>;
}
