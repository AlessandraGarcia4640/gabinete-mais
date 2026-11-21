import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routineFrequencySchema, userPositionSchema, type Routine } from '@gabinete-plus/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AppBar, AppText, Banner, Button, Chip, ChipGroup, FooterBar, OrderedEditor, Screen, SelectField, Sheet, TextField, Switch,
} from '../../components';
import { DiscardDialog } from '../../components/discard-dialog';
import { strings } from '../../lib/strings';
import { dimensions, size, spacing } from '../../lib/theme';
import { PreventFormRemoval } from '../../navigation/prevent-form-removal';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { initialValues, routineChanges, routineFormSchema, toRoutinePayload, type RoutineFormValues } from './form-model';
import { routineError, useRoutinesApi } from './hooks';

const copy = strings.routines;
type TextName = 'title' | 'category' | 'frequencyDetails' | 'specificDate' | 'description' | 'instructions';
const positions = ['', ...userPositionSchema.options] satisfies RoutineFormValues['defaultPosition'][];

interface RoutineFormProps {
  routine?: Routine;
  onSaved: (routine: Routine) => void;
  onCancel: () => void;
  guardNavigation?: boolean;
}

export function RoutineForm({ routine, onSaved, onCancel, guardNavigation = false }: RoutineFormProps) {
  const [baseline] = useState(routine);
  const [message, setMessage] = useState<string | null>(null);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const [selectPosition, setSelectPosition] = useState(false);
  const cancelRef = useRef<View>(null);
  const positionRef = useRef<View>(null);
  const approvedExit = useRef(false);
  const api = useRoutinesApi();
  const client = useQueryClient();
  const { user } = useSession();
  const manager = useSessionManager();
  const form = useForm<RoutineFormValues>({ resolver: zodResolver(routineFormSchema), defaultValues: initialValues(baseline) });
  const { isDirty, isSubmitting } = form.formState;
  useEffect(() => { if (!isDirty) approvedExit.current = false; }, [isDirty]);
  const frequency = form.watch('frequency');
  const frequencyDetails = form.watch('frequencyDetails');
  const position = form.watch('defaultPosition');
  const steps = useFieldArray({ control: form.control, name: 'steps' });
  const save = useMutation({
    retry: false,
    mutationFn: (values: RoutineFormValues) => {
      const payload = toRoutinePayload(values);
      if (!baseline) return api.create(payload);
      const changes = routineChanges(baseline, payload);
      return changes ? api.update(baseline.id, changes) : Promise.resolve(null);
    },
  });
  const busy = save.isPending || isSubmitting;
  const modalOpen = selectPosition || discard !== null;

  async function submit(values: RoutineFormValues) {
    setMessage(null);
    try {
      const saved = await save.mutateAsync(values);
      if (!saved) { setMessage(copy.noChanges); return; }
      if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return;
      form.reset(initialValues(saved));
      client.setQueryData(['routine', saved.id, user?.id], saved);
      void Promise.all([
        client.invalidateQueries({ queryKey: ['routines'] }),
        client.invalidateQueries({ queryKey: ['routine', saved.id] }),
      ]);
      approvedExit.current = true;
      onSaved(saved);
    } catch (error) {
      setMessage(error instanceof Error ? routineError(error) : copy.requestError);
      void client.invalidateQueries({ queryKey: ['routine', baseline?.id] });
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
    form.reset(initialValues(baseline));
    setMessage(null);
    setDiscard(null);
    discard?.();
  }

  function textField(name: TextName, options: {
    help?: string; placeholder?: string; multiline?: boolean; optional?: boolean; mono?: boolean;
  } = {}) {
    return (
      <Controller control={form.control} name={name} render={({ field, fieldState }) => (
        <TextField ref={field.ref} label={name === 'title' ? copy.name : copy[name]} value={field.value}
          onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} {...options}
          style={options.multiline ? styles.textArea : undefined} errorText={fieldState.error && copy.validation[name]} />
      )} />
    );
  }

  return (
    <Screen keyboard>
      <View style={styles.form} accessibilityElementsHidden={modalOpen} importantForAccessibility={modalOpen ? 'no-hide-descendants' : 'auto'}>
        <AppBar title={baseline ? copy.edit : copy.create} onBack={() => attemptExit(onCancel)} />
        <View style={styles.column}>
          <FlashList data={steps.fields} keyExtractor={(entry) => entry.id} contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View style={styles.fields}>
                {!baseline && <Banner tone="neutral" message={copy.formHelp} />}
                {textField('title')}
                {textField('category', { help: copy.categoryHelp })}
                <View style={styles.group}>
                  <AppText variant="label">{copy.frequency}</AppText>
                  <Controller control={form.control} name="frequency" render={({ field, fieldState }) => (
                    <>
                      <ChipGroup label={copy.frequency} selection="radio">
                        {routineFrequencySchema.options.map((value) => (
                          <Chip key={value} mode="radio" label={strings.dashboard.frequency[value]} selected={field.value === value}
                            disabled={busy} onPress={() => field.onChange(value)} />
                        ))}
                      </ChipGroup>
                      {fieldState.error && <AppText variant="caption" color="danger" role="alert">{copy.validation.frequency}</AppText>}
                    </>
                  )} />
                </View>
                {(frequency === 'PERSONALIZADA' || !!baseline?.frequencyDetails || !!frequencyDetails) &&
                  textField('frequencyDetails', { multiline: true, optional: frequency !== 'PERSONALIZADA' })}
                {textField('specificDate', { mono: true, optional: true, placeholder: copy.datePlaceholder, help: copy.frequencyDateHelp })}
                <Controller control={form.control} name="defaultPosition" render={({ field, fieldState }) => (
                  <SelectField ref={positionRef} label={copy.defaultPosition}
                    value={field.value ? copy.positions[field.value] : undefined} placeholder={copy.noPosition}
                    optional disabled={busy} expanded={selectPosition} onPress={() => setSelectPosition(true)}
                    errorText={fieldState.error && copy.validation.defaultPosition} />
                )} />
                <Controller control={form.control} name="essentialForTransition" render={({ field }) => (
                  <Switch label={copy.essential} description={copy.essentialHelp} checked={field.value} onChange={field.onChange} disabled={busy} />
                )} />
                <AppText variant="label">{copy.steps}</AppText>
              </View>
            }
            ListEmptyComponent={<AppText variant="body" color="inkMuted">{copy.noSteps}</AppText>}
            renderItem={({ index }) => (
              <View style={styles.step}>
                <OrderedEditor position={index + 1}
                  field={<Controller control={form.control} name={`steps.${index}.text`} render={({ field, fieldState }) => (
                    <TextField ref={field.ref} label={copy.step(index)} hideLabel value={field.value} multiline
                      onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} style={styles.stepField}
                      errorText={fieldState.error && copy.validation.steps} />
                  )} />}
                  up={{ label: copy.moveUp(index), disabled: busy || index === 0, onPress: () => steps.move(index, index - 1) }}
                  down={{ label: copy.moveDown(index), disabled: busy || index === steps.fields.length - 1, onPress: () => steps.move(index, index + 1) }}
                  remove={{ label: copy.removeStep(index), disabled: busy, onPress: () => steps.remove(index) }}
                />
              </View>
            )}
            ListFooterComponent={
              <View style={styles.fields}>
                <Button label={copy.addStep} icon="plus" variant="ghost" disabled={busy || steps.fields.length >= 100}
                  onPress={() => steps.append({ text: '' })} />
                {textField('description', { multiline: true, optional: true })}
                {textField('instructions', { multiline: true, optional: true, placeholder: copy.instructionsPlaceholder })}
              </View>
            }
          />
        </View>
        {!!message && (
          <View style={styles.feedback}>
            <Banner tone={message === copy.noChanges ? 'neutral' : 'danger'} message={message} />
          </View>
        )}
        <FooterBar>
          <Button ref={cancelRef} label={copy.cancel} variant="secondary" disabled={busy} onPress={() => attemptExit(onCancel)} />
          <Button label={copy.save} loading={busy} disabled={!!baseline && !isDirty} onPress={() => void form.handleSubmit(submit)()} />
        </FooterBar>
      </View>
      <Sheet title={copy.defaultPosition} visible={selectPosition} returnFocusRef={positionRef} onDismiss={() => setSelectPosition(false)}>
        <ScrollView>
          <ChipGroup label={copy.defaultPosition} selection="radio">
            {positions.map((value) => (
              <Chip key={value} label={value ? copy.positions[value] : copy.noPosition} mode="radio" selected={value === position}
                onPress={() => { form.setValue('defaultPosition', value, { shouldDirty: true, shouldValidate: true }); setSelectPosition(false); }} />
            ))}
          </ChipGroup>
        </ScrollView>
      </Sheet>
      <DiscardDialog visible={discard !== null} onDismiss={() => setDiscard(null)} returnFocusRef={cancelRef} onDiscard={discardChanges} />
      {guardNavigation && <PreventFormRemoval dirty={isDirty || busy} onAttempt={attemptExit} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, minHeight: 0 },
  column: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: size.contentMax },
  content: { padding: spacing.space4 },
  fields: { gap: spacing.space5, paddingBottom: spacing.space2 },
  group: { gap: spacing.space2 },
  step: { paddingBottom: spacing.space2 },
  stepField: { minHeight: size.touchTarget, paddingHorizontal: spacing.space2, borderWidth: 0 },
  textArea: { minHeight: dimensions.formTextArea },
  feedback: { paddingHorizontal: spacing.space4, paddingBottom: spacing.space2 },
});
