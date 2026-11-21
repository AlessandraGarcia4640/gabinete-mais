import { AppText } from '../../components/app-text';
import { z } from 'zod';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGuidelineSchema, guidelineCategorySchema, guidelineVersionParamsSchema, userIdParamsSchema, type CreateGuideline, type Guideline } from '@gabinete-plus/shared';
import { Button, Card, Choice, Checkbox, Screen, TextField, EmptyState, ErrorState, LoadingState } from '../../components';
import { MarkdownContent } from '../../components/markdown-content';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { useStyles } from '../tasks/styles';
import { guidelineError, useGuideline, useGuidelineHistory, useGuidelinesApi } from './hooks';
export { GuidelineListScreen } from './list-screen';
export { GuidelineDetailScreen } from './detail-screen';
function useId() { const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); return valid.success ? valid.data.id : undefined; }
export function GuidelineFormScreen({ mode }: { mode: 'create' | 'edit' }) { const id = useId(); const { user } = useSession(); const query = useGuideline(mode === 'edit' && user?.role === 'CHEFE' ? id : undefined);
  if (user?.role !== 'CHEFE') return <EmptyState message={strings.guidelines.forbidden} />; if (mode === 'edit' && !id) return <EmptyState message={strings.guidelines.notFound} />; if (mode === 'edit' && query.isPending) return <LoadingState />; if (mode === 'edit' && query.isError) return <ErrorState message={guidelineError(query.error)} retry={() => void query.refetch()} />; if (query.data?.isArchived) return <EmptyState message={strings.guidelines.archived} />;
  return <GuidelineForm key={id ?? 'new'} guideline={mode === 'edit' ? query.data : undefined} />;
}
export function GuidelineForm({ guideline }: { guideline?: Guideline }) {
  const styles = useStyles();
  const [baseline] = useState(guideline); const [preview, setPreview] = useState(false); const [message, setMessage] = useState<string | null>(null); const [discard, setDiscard] = useState(false); const api = useGuidelinesApi(); const manager = useSessionManager(); const { user } = useSession(); const client = useQueryClient(); const router = useRouter();
  const form = useForm<CreateGuideline>({ resolver: zodResolver(createGuidelineSchema.extend({ essentialForTransition: z.boolean() })), defaultValues: { title: baseline?.title ?? '', category: baseline?.category ?? 'OUTROS', content: baseline?.content ?? '', essentialForTransition: baseline?.essentialForTransition ?? false } }); const dirty = form.formState.isDirty; const content = form.watch('content');
  const save = useMutation({ retry: false, mutationFn: (values: CreateGuideline) => baseline ? api.update(baseline.id, { ...values, expectedVersion: baseline.version }) : api.create(values) });
  async function submit(values: CreateGuideline) { setMessage(null); try { const result = await save.mutateAsync(values); if (manager.store.getState().user?.id !== user?.id || manager.store.getState().status !== 'authenticated') return; client.setQueryData(['guideline', result.id, user?.id], result); void Promise.all([client.invalidateQueries({ queryKey: ['guidelines'] }), client.invalidateQueries({ queryKey: ['guideline-versions', result.id] })]); router.replace({ pathname: '/orientacao/[id]', params: { id: result.id } }); } catch (error) { setMessage(error instanceof Error ? guidelineError(error) : strings.contacts.requestError); if (baseline) void client.invalidateQueries({ queryKey: ['guideline', baseline.id] }); } }
  const busy = save.isPending || form.formState.isSubmitting; const cancel = () => { if (baseline) router.replace({ pathname: '/orientacao/[id]', params: { id: baseline.id } }); else router.replace('/orientacoes'); };
  return <Screen keyboard><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><View style={styles.section}>
    <Controller control={form.control} name="title" render={({ field, fieldState }) => <TextField label={strings.guidelines.name} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} editable={!busy} errorText={fieldState.error ? strings.guidelines.validation.title : undefined} />} />
    <AppText variant="bodyStrong" style={styles.label}>{strings.guidelines.category}</AppText><Controller control={form.control} name="category" render={({ field }) => <View style={styles.choices}>{guidelineCategorySchema.options.map((v) => <Choice key={v} label={strings.guidelines.categories[v]} selected={field.value === v} disabled={busy} onPress={() => field.onChange(v)} />)}</View>} />
    <Controller control={form.control} name="essentialForTransition" render={({ field }) => <Checkbox label={strings.guidelines.essential} checked={field.value} disabled={busy} onChange={field.onChange} />} />
    <Button label={preview ? strings.guidelines.write : strings.guidelines.preview} variant="secondary" onPress={() => setPreview(!preview)} />
    {preview ? content.trim() ? <MarkdownContent content={content} /> : <EmptyState message={strings.guidelines.emptyContent} /> : <Controller control={form.control} name="content" render={({ field, fieldState }) => <TextField label={strings.guidelines.content} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} multiline editable={!busy} style={{ minHeight: 220, textAlignVertical: 'top' }} errorText={fieldState.error ? strings.guidelines.validation.content : undefined} />} />}
    {!!message && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{message}</AppText>}{message === strings.guidelines.conflict && <Button label={strings.guidelines.reopen} variant="secondary" onPress={cancel} />}
    <Button label={strings.routines.save} loading={busy} disabled={!!baseline && !dirty} onPress={() => void form.handleSubmit(submit)()} /><Button label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => { if (dirty) setDiscard(true); else cancel(); }} />
    {discard && <><AppText variant="body">{strings.routines.unsavedTitle}</AppText><Button label={strings.routines.discard} onPress={cancel} /><Button label={strings.routines.continueEditing} variant="secondary" onPress={() => setDiscard(false)} /></>}
  </View></ScrollView></Screen>;
}
export function GuidelineHistoryScreen() {
  const styles = useStyles();
  const id = useId(); const query = useGuidelineHistory(id); const router = useRouter(); if (!id) return <EmptyState message={strings.guidelines.notFound} />; if (query.isPending) return <LoadingState />; if (query.isError && !query.data) return <ErrorState message={guidelineError(query.error)} retry={() => void query.refetch()} />;
  return <Screen><FlashList data={query.data?.pages.flatMap((page) => page.items) ?? []} keyExtractor={(v) => v.id} contentContainerStyle={styles.content} renderItem={({ item }) => <Card label={strings.guidelines.version(item.version)} onPress={() => router.push({ pathname: '/orientacao/[id]/versao/[version]', params: { id: item.guidelineId, version: String(item.version) } })}><AppText variant="bodyStrong" style={styles.label}>{strings.guidelines.version(item.version)} · {item.title}</AppText><AppText variant="body">{item.authorName} · {new Date(item.createdAt).toLocaleString('pt-BR')}</AppText></Card>} ListEmptyComponent={<EmptyState message={strings.guidelines.emptyHistory} />} ListFooterComponent={<View>{query.isError && <ErrorState updating retry={() => void query.refetch()} />}{query.hasNextPage && <Button label={strings.feedback.loadMore} loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}</View>} /></Screen>;
}
export function GuidelineVersionScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const valid = guidelineVersionParamsSchema.safeParse({ id: params.id, version: params.version }); const api = useGuidelinesApi(); const { user } = useSession(); const query = useQuery({ queryKey: ['guideline-version', params.id, params.version, user?.id], enabled: valid.success && !!user, retry: false, queryFn: ({ signal }) => valid.success ? api.version(valid.data.id, valid.data.version, signal) : Promise.reject(new Error(strings.guidelines.notFound)) });
  if (!valid.success) return <EmptyState message={strings.guidelines.notFound} />; if (query.isPending) return <LoadingState />; if (query.isError) return <ErrorState message={guidelineError(query.error)} retry={() => void query.refetch()} />;
  return <Screen><ScrollView contentContainerStyle={styles.content}><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{query.data.title}</AppText><AppText variant="body">{strings.guidelines.version(query.data.version)} · {query.data.authorName}</AppText><MarkdownContent content={query.data.content} /></ScrollView></Screen>;
}
