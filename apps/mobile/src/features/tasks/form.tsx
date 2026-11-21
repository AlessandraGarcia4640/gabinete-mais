import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskPrioritySchema, type Task } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Avatar, Banner, Button, Card, Chip, ChipGroup, FooterBar, Overline, Screen,
  SelectField, TextField,
} from '../../components';
import { DiscardDialog } from '../../components/discard-dialog';
import { strings } from '../../lib/strings';
import { breakpoint, dimensions, line, size, spacing } from '../../lib/theme';
import { PreventFormRemoval } from '../../navigation/prevent-form-removal';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import type { ResourceKind, ResourceOption } from './api';
import { taskError, useTasksApi } from './hooks';
import { initialTaskValues, taskChanges, taskFormSchema, taskPayload, type TaskFormValues } from './model';
import { ResourcePicker } from './picker';

const copy = strings.tasks;
const resources = {
  routine: { field: 'routineId', select: copy.selectRoutine },
  run: { field: 'checklistRunId', select: copy.selectRun },
  contact: { field: 'contactId', select: copy.selectContact },
} satisfies Record<Exclude<ResourceKind, 'person'>, { field: keyof TaskFormValues; select: string }>;
const resourceOrder = ['routine', 'run', 'contact'] satisfies (keyof typeof resources)[];
const emptyLinks = { routine: null, contact: null, run: null };

interface TaskFormProps {
  task?: Task;
  onSaved: (task: Task) => void;
  onCancel: () => void;
  guardNavigation?: boolean;
}

export function TaskForm({ task, onSaved, onCancel, guardNavigation = false }: TaskFormProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const wide = width >= breakpoint.expanded;
  const [baseline] = useState(task);
  const [message, setMessage] = useState<string | null>(null);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const [picker, setPicker] = useState<{ kind: ResourceKind; visible: boolean }>();
  const [selectedPerson, setSelectedPerson] = useState<ResourceOption>();
  const [labels, setLabels] = useState<Record<keyof typeof resources, string | null>>(emptyLinks);
  const personRef = useRef<View>(null);
  const routineRef = useRef<View>(null);
  const runRef = useRef<View>(null);
  const contactRef = useRef<View>(null);
  const cancelRef = useRef<View>(null);
  const approvedExit = useRef(false);
  const { user } = useSession();
  const manager = useSessionManager();
  const api = useTasksApi();
  const client = useQueryClient();
  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues: initialTaskValues(user?.id ?? '', baseline) });
  const { isDirty, isSubmitting } = form.formState;
  useEffect(() => { if (!isDirty) approvedExit.current = false; }, [isDirty]);
  const assigneeId = form.watch('assigneeId');
  const routineId = form.watch('routineId');
  const save = useMutation({
    retry: false,
    mutationFn: (values: TaskFormValues) => {
      if (!baseline) return api.create(taskPayload(values));
      const changes = taskChanges(baseline, values);
      return changes ? api.update(baseline.id, changes) : Promise.resolve(null);
    },
  });
  const busy = save.isPending || isSubmitting;
  const title = baseline ? copy.edit : copy.create;
  const isChief = user?.role === 'CHEFE';
  const isSelf = assigneeId === user?.id;
  const displayedPerson = isSelf ? user?.name : selectedPerson?.label;
  const role = isSelf ? user?.role : selectedPerson?.role;
  const personValue = displayedPerson && role ? copy.personWithRole(displayedPerson, strings.session.roles[role]) : displayedPerson;
  const modalOpen = !!(picker?.visible || discard);
  const openPicker = (kind: ResourceKind) => setPicker({ kind, visible: true });
  const closePicker = () => setPicker((value) => value && { ...value, visible: false });
  const pickerRefs = { person: personRef, routine: routineRef, run: runRef, contact: contactRef };

  async function submit(values: TaskFormValues) {
    setMessage(null);
    try {
      const saved = await save.mutateAsync(values);
      if (!saved) { setMessage(strings.routines.noChanges); return; }
      if (manager.store.getState().status !== 'authenticated' || manager.store.getState().user?.id !== user?.id) return;
      form.reset(initialTaskValues(user?.id ?? '', saved));
      client.setQueryData(['task', saved.id, user?.id], saved);
      void client.invalidateQueries({ queryKey: ['tasks'] });
      approvedExit.current = true;
      onSaved(saved);
    } catch (error) {
      setMessage(error instanceof Error ? taskError(error) : strings.contacts.requestError);
      if (baseline) void client.invalidateQueries({ queryKey: ['task', baseline.id] });
    }
  }

  function select(kind: ResourceKind, option: ResourceOption) {
    if (kind === 'person') {
      form.setValue('assigneeId', option.id, { shouldDirty: true });
      form.setValue('checklistRunId', null, { shouldDirty: true });
      setSelectedPerson(option);
      setLabels({ ...labels, run: null });
    } else {
      const next = { ...labels, [kind]: option.label };
      form.setValue(resources[kind].field, option.id, { shouldDirty: true });
      if (kind === 'routine') {
        form.setValue('checklistRunId', null, { shouldDirty: true });
        next.run = null;
      }
      if (kind === 'run' && option.routineId) {
        form.setValue('routineId', option.routineId, { shouldDirty: true });
        next.routine = option.routineTitle ?? copy.routine;
      }
      setLabels(next);
    }
    closePicker();
  }

  function clear(kind: keyof typeof resources) {
    form.setValue(resources[kind].field, null, { shouldDirty: true });
    if (kind === 'routine') form.setValue('checklistRunId', null, { shouldDirty: true });
    setLabels({ ...labels, [kind]: null, ...(kind === 'routine' ? { run: null } : {}) });
    closePicker();
  }

  function attemptExit(proceed: () => void) {
    if (approvedExit.current) { proceed(); return; }
    if (busy) return;
    if (isDirty) setDiscard(() => proceed);
    else proceed();
  }

  function discardChanges() {
    approvedExit.current = true;
    form.reset(initialTaskValues(user?.id ?? '', baseline));
    setLabels(emptyLinks);
    setSelectedPerson(undefined);
    setMessage(null);
    setDiscard(null);
    discard?.();
  }

  const cancel = <Button ref={cancelRef} label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => attemptExit(onCancel)} />;
  const saveButton = <Button label={strings.routines.save} loading={busy} disabled={!!baseline && !isDirty} onPress={() => void form.handleSubmit(submit)()} />;
  const feedback = message && <Banner tone={message === strings.routines.noChanges ? 'neutral' : 'danger'} message={message} />;
  const clearable = picker?.kind && picker.kind !== 'person' ? picker.kind : undefined;
  const fields = (
    <View style={[styles.fields, wide && styles.columns]}>
      <View style={[styles.fields, wide && styles.column]}>
        <Controller control={form.control} name="title" render={({ field, fieldState }) => (
          <TextField ref={field.ref} label={copy.name} value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} editable={!busy} errorText={fieldState.error && copy.validation.title} />
        )} />
        <Controller control={form.control} name="description" render={({ field, fieldState }) => (
          <TextField ref={field.ref} label={copy.description} value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} editable={!busy} multiline optional style={styles.textArea} errorText={fieldState.error && copy.validation.description} />
        )} />
        <Controller control={form.control} name="dueDate" render={({ field, fieldState }) => (
          <TextField ref={field.ref} label={copy.dueDate} value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} editable={!busy} mono optional placeholder={strings.routines.datePlaceholder} errorText={fieldState.error && copy.validation.dueDate} />
        )} />
        <View>
          <AppText variant="label">{copy.priority}</AppText>
          <Controller control={form.control} name="priority" render={({ field, fieldState }) => (
            <>
              <ChipGroup label={copy.priority} selection="radio">
                {taskPrioritySchema.options.map((value) => (
                  <Chip key={value} mode="radio" label={strings.dashboard.priority[value]} selected={field.value === value}
                    disabled={busy} onPress={() => field.onChange(value)} />
                ))}
              </ChipGroup>
              {fieldState.error && <AppText variant="caption" role="alert" color="danger">{copy.validation.priority}</AppText>}
            </>
          )} />
        </View>
        {!baseline && (
          <View style={styles.group}>
            {isChief ? (
              <SelectField ref={personRef} label={copy.assignee} accessibilityLabel={copy.selectPerson} value={personValue}
                placeholder={copy.personUnknown} disabled={busy} expanded={picker?.visible && picker.kind === 'person'}
                start={<Avatar name={displayedPerson} size="sm" />} onPress={() => openPicker('person')} />
            ) : (
              <>
                <AppText variant="label">{copy.assignee}</AppText>
                <AppText variant="body">{personValue ?? copy.personUnknown}</AppText>
              </>
            )}
            {user && (isChief || !isSelf) && <Button style={styles.self} label={copy.self} variant="ghost" disabled={busy || isSelf}
              onPress={() => select('person', { id: user.id, label: user.name, role: user.role })} />}
          </View>
        )}
      </View>
      <View style={[styles.fields, wide && styles.column]}>
        <View style={styles.links}>
          <Overline>{copy.links}</Overline>
          {baseline ? <AppText variant="body" color="inkMuted">{copy.linksFixed}</AppText> : resourceOrder.map((kind) => (
            <SelectField key={kind} ref={pickerRefs[kind]} label={copy[kind]} accessibilityLabel={resources[kind].select}
              value={labels[kind] ?? copy.noLink} placeholder={copy.noLink} expanded={picker?.visible && picker.kind === kind}
              optional disabled={busy} onPress={() => openPicker(kind)} />
          ))}
        </View>
        <Controller control={form.control} name="instructions" render={({ field, fieldState }) => (
          <TextField ref={field.ref} label={copy.instructions} value={field.value} onChangeText={field.onChange}
            onBlur={field.onBlur} editable={!busy} multiline optional style={styles.textArea}
            placeholder={copy.instructionsPlaceholder} help={baseline ? undefined : copy.inheritance}
            errorText={fieldState.error && copy.validation.instructions} />
        )} />
      </View>
    </View>
  );

  return (
    <Screen keyboard>
      <View style={styles.form} accessibilityElementsHidden={modalOpen} importantForAccessibility={modalOpen ? 'no-hide-descendants' : 'auto'}>
        {!wide && <AppBar title={title} onBack={() => attemptExit(onCancel)} />}
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, wide && styles.wideContent]}>
          {wide ? (
            <>
              <View style={styles.group}>
                <AppText variant="titleLg" accessibilityRole="header">{title}</AppText>
                <AppText variant="body" color="inkMuted">{copy.formHelp}</AppText>
              </View>
              <Card style={styles.card}>
                {fields}
                {feedback}
                <View style={[styles.wideFooter, { borderTopColor: colors.border }]}>{cancel}{saveButton}</View>
              </Card>
            </>
          ) : <><Banner tone="neutral" message={copy.formHelp} />{fields}</>}
        </ScrollView>
        {!wide && feedback && <View style={styles.feedback}>{feedback}</View>}
        {!wide && <FooterBar>{cancel}{saveButton}</FooterBar>}
      </View>
      {picker && (
        <ResourcePicker kind={picker.kind} visible={picker.visible} assigneeId={assigneeId} routineId={routineId}
          returnFocusRef={pickerRefs[picker.kind]} onClose={closePicker} onSelect={(option) => select(picker.kind, option)}
          onClear={clearable ? () => clear(clearable) : undefined} />
      )}
      <DiscardDialog visible={!!discard} onDismiss={() => setDiscard(null)} returnFocusRef={cancelRef}
        onDiscard={discardChanges} />
      {guardNavigation && <PreventFormRemoval dirty={isDirty || busy} onAttempt={attemptExit} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, minHeight: 0 },
  content: { width: '100%', alignSelf: 'center', padding: spacing.space4, gap: spacing.space5, maxWidth: size.contentMax },
  wideContent: { maxWidth: dimensions.formMax, padding: spacing.space8, gap: spacing.space6 },
  card: { padding: spacing.space6, gap: spacing.space6 },
  fields: { gap: spacing.space5 },
  columns: { flexDirection: 'row', gap: spacing.space5 },
  column: { flex: 1, minWidth: 0 },
  group: { gap: spacing.space1 },
  self: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  links: { gap: spacing.space3 },
  textArea: { minHeight: dimensions.formTextArea },
  wideFooter: {
    borderTopWidth: line.thin, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end',
    gap: spacing.space3, paddingTop: spacing.space6,
  },
  feedback: { paddingHorizontal: spacing.space4, paddingBottom: spacing.space2 },
});
