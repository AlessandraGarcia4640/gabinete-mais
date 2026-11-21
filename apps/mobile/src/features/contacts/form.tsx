import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Contact } from '@gabinete-plus/shared';
import { AppBar, AppText, Banner, Button, FooterBar, IconButton, Screen, Sheet, Switch, TextField } from '../../components';
import { Control } from '../../components/control';
import { DiscardDialog } from '../../components/discard-dialog';
import { strings } from '../../lib/strings';
import { dimensions, line, radius, size, spacing } from '../../lib/theme';
import { PreventFormRemoval } from '../../navigation/prevent-form-removal';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { contactError, useContactsApi } from './hooks';
import { contactChanges, contactFormSchema, contactPayload, initialContactValues, type ContactFormValues } from './model';

const copy = strings.contacts;
const identityFields = ['name', 'organization', 'jobTitle', 'email'] satisfies (keyof ContactFormValues)[];
type TagDraft = { index: number; value: string; adding: boolean; invalid: boolean };

interface ContactFormProps {
  contact?: Contact;
  onSaved: (contact: Contact) => void;
  onCancel: () => void;
  guardNavigation?: boolean;
}

export function ContactForm({ contact, onSaved, onCancel, guardNavigation = false }: ContactFormProps) {
  const { colors } = useTheme();
  const [baseline] = useState(contact);
  const [message, setMessage] = useState<string | null>(null);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const [tag, setTag] = useState<TagDraft | null>(null);
  const addTagRef = useRef<View>(null);
  const tagTrigger = useRef<View>(null);
  const tagRefs = useRef(new Map<string, View>());
  const cancelRef = useRef<View>(null);
  const approvedExit = useRef(false);
  const api = useContactsApi();
  const client = useQueryClient();
  const { user } = useSession();
  const manager = useSessionManager();
  const form = useForm<ContactFormValues>({ resolver: zodResolver(contactFormSchema), defaultValues: initialContactValues(baseline) });
  const { isDirty, isSubmitting, errors } = form.formState;
  useEffect(() => { if (!isDirty) approvedExit.current = false; }, [isDirty]);
  const phones = useFieldArray({ control: form.control, name: 'phones' });
  const tags = useFieldArray({ control: form.control, name: 'tags' });
  const tagValues = form.watch('tags');
  const save = useMutation({
    retry: false,
    mutationFn: (values: ContactFormValues) => {
      const payload = contactPayload(values);
      if (!baseline) return api.create(payload);
      const changes = contactChanges(baseline, payload);
      return changes ? api.update(baseline.id, changes) : Promise.resolve(null);
    },
  });
  const busy = save.isPending || isSubmitting;
  const modalOpen = !!(discard || tag);

  async function submit(values: ContactFormValues) {
    setMessage(null);
    try {
      const saved = await save.mutateAsync(values);
      if (!saved) { setMessage(strings.routines.noChanges); return; }
      if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return;
      form.reset(initialContactValues(saved));
      client.setQueryData(['contact', saved.id, user?.id], saved);
      void client.invalidateQueries({ queryKey: ['contacts'] });
      approvedExit.current = true;
      onSaved(saved);
    } catch (error) {
      setMessage(error instanceof Error ? contactError(error) : copy.requestError);
    }
  }

  function attemptExit(proceed: () => void) {
    if (approvedExit.current) { proceed(); return; }
    if (busy) return;
    if (tag) { setTag(null); return; }
    if (isDirty) setDiscard(() => proceed);
    else proceed();
  }

  function saveTag() {
    if (!tag) return;
    if (!tag.value.trim() || tag.value.trim().length > 40) { setTag({ ...tag, invalid: true }); return; }
    if (tag.adding) tags.append({ text: tag.value }, { shouldFocus: false });
    else form.setValue(`tags.${tag.index}.text`, tag.value, { shouldDirty: true, shouldValidate: true });
    setTag(null);
  }

  return (
    <Screen keyboard>
      <View style={styles.form} accessibilityElementsHidden={modalOpen} importantForAccessibility={modalOpen ? 'no-hide-descendants' : 'auto'}>
        <AppBar title={baseline ? copy.edit : copy.create} onBack={() => attemptExit(onCancel)} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {identityFields.map((name) => (
            <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
              <TextField ref={field.ref} label={copy[name]} value={field.value} onChangeText={field.onChange}
                onBlur={field.onBlur} editable={!busy} optional={name === 'jobTitle' || name === 'email'}
                keyboardType={name === 'email' ? 'email-address' : 'default'} autoCapitalize={name === 'email' ? 'none' : 'sentences'}
                errorText={fieldState.error && copy.validation[name]} />
            )} />
          ))}
          <View style={styles.group}>
            <AppText variant="label" accessibilityRole="header">{copy.phones}</AppText>
            {phones.fields.map(({ id }, index) => (
              <Controller key={id} control={form.control} name={`phones.${index}.text`} render={({ field, fieldState }) => (
                <TextField ref={field.ref} label={copy.phone(index)} hideLabel value={field.value} onChangeText={field.onChange}
                  onBlur={field.onBlur} editable={!busy} keyboardType="phone-pad" errorText={fieldState.error && copy.validation.phones}
                  accessory={<IconButton label={copy.removePhone(index)} icon="trash-2" disabled={busy} onPress={() => phones.remove(index)} />} />
              )} />
            ))}
            <Button label={copy.addPhone} icon="plus" variant="ghost" disabled={busy || phones.fields.length >= 10}
              onPress={() => phones.append({ text: '' })} />
          </View>
          <View style={styles.group}>
            <AppText variant="label" accessibilityRole="header">{copy.tags}</AppText>
            <View style={styles.tags}>
              {tags.fields.map(({ id }, index) => {
                const value = tagValues[index]?.text.trim() || copy.tag(index);
                return (
                  <View key={id} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
                    <Control ref={(node) => { if (node) tagRefs.current.set(id, node); else tagRefs.current.delete(id); }}
                      accessibilityRole="button" accessibilityLabel={copy.editTag(value)} disabled={busy}
                      style={styles.tagText} onPress={() => {
                        tagTrigger.current = tagRefs.current.get(id) ?? null;
                        setTag({ value, index, adding: false, invalid: false });
                      }}>
                      <AppText variant="label">{value}</AppText>
                    </Control>
                    <IconButton label={copy.removeNamedTag(value)} icon="x" disabled={busy} onPress={() => tags.remove(index)} />
                  </View>
                );
              })}
            </View>
            {!!errors.tags && <AppText variant="caption" color="danger" role="alert">{copy.validation.tags}</AppText>}
            <Button ref={addTagRef} label={copy.addTag} icon="plus" variant="ghost" style={styles.addTag}
              disabled={busy || tags.fields.length >= 20} onPress={() => {
                tagTrigger.current = addTagRef.current;
                setTag({ value: '', index: tags.fields.length, adding: true, invalid: false });
              }} />
          </View>
          <Controller control={form.control} name="isKeyContact" render={({ field }) => (
            <Switch label={copy.keyContact} description={strings.routines.essentialHelp}
              checked={field.value} disabled={busy} onChange={field.onChange} />
          )} />
          <Controller control={form.control} name="notes" render={({ field, fieldState }) => (
            <TextField ref={field.ref} label={copy.notes} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
              editable={!busy} multiline optional style={styles.notes} errorText={fieldState.error && copy.validation.notes} />
          )} />
        </ScrollView>
        {!!message && <View style={styles.feedback}>
          <Banner tone={message === strings.routines.noChanges ? 'neutral' : 'danger'} message={message} />
        </View>}
        <FooterBar>
          <Button ref={cancelRef} label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => attemptExit(onCancel)} />
          <Button label={strings.routines.save} loading={busy} disabled={!!baseline && !isDirty} onPress={() => void form.handleSubmit(submit)()} />
        </FooterBar>
      </View>
      <Sheet visible={!!tag} title={tag?.adding ? copy.addTag : copy.editTagTitle} returnFocusRef={tagTrigger} onDismiss={() => setTag(null)}>
        {tag && (
          <ScrollView contentContainerStyle={styles.group} keyboardShouldPersistTaps="handled">
            <TextField label={copy.tag(tag.index)} value={tag.value} onChangeText={(value) => setTag({ ...tag, value, invalid: false })}
              autoCapitalize="none" maxLength={40} errorText={tag.invalid ? copy.validation.tags : undefined} onSubmitEditing={saveTag} />
            <Button label={copy.confirmTag} onPress={saveTag} />
          </ScrollView>
        )}
      </Sheet>
      <DiscardDialog visible={!!discard} onDismiss={() => setDiscard(null)} returnFocusRef={cancelRef} onDiscard={() => {
        approvedExit.current = true;
        form.reset();
        setMessage(null);
        setDiscard(null);
        discard?.();
      }} />
      {guardNavigation && <PreventFormRemoval dirty={isDirty || busy || !!tag} onAttempt={attemptExit} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { flex: 1, minHeight: 0 },
  content: { alignSelf: 'center', width: '100%', maxWidth: size.contentMax, padding: spacing.space4, gap: spacing.space5 },
  group: { gap: spacing.space2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 },
  tag: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%', borderRadius: radius.full, borderWidth: line.control },
  tagText: { minHeight: size.touchTarget, minWidth: size.touchTarget, flexShrink: 1, justifyContent: 'center', paddingStart: spacing.space3, borderRadius: radius.full },
  addTag: { alignSelf: 'flex-start' },
  notes: { minHeight: dimensions.formTextArea },
  feedback: { paddingHorizontal: spacing.space4, paddingBottom: spacing.space2 },
});
