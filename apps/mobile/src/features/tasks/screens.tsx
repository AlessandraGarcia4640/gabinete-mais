import { AppText } from '../../components/app-text';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card } from '../../components/card';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userIdParamsSchema, type Task, type TaskEventPage } from '@gabinete-plus/shared';
import { Button } from '../../components/button';
import { strings } from '../../lib/strings';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { displayDate } from '../dashboard/model';
import { useRoutine } from '../routines/hooks';
import { useContact } from '../contacts/hooks';
import { useRun } from '../checklists/hooks';
import { taskError, useTask, useTaskHistory, useTaskPerson, useTasksApi } from './hooks';
import { taskActions } from './model';
import { TaskForm } from './form';
import { ResourcePicker } from './picker';
import type { ResourceOption } from './api';
import { useStyles } from './styles';
function useId() { const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); return valid.success ? valid.data.id : undefined; }
export { TaskListScreen } from './list-screen';
type Command = { kind: 'status'; status: Task['status'] } | { kind: 'assign'; assigneeId: string };
export function TaskDetailScreen() {
  const styles = useStyles();
  const id = useId(); const query = useTask(id); const { user } = useSession(); const manager = useSessionManager(); const client = useQueryClient(); const api = useTasksApi(); const router = useRouter();
  const owner = useTaskPerson(query.data?.assigneeId); const creator = useTaskPerson(query.data?.createdById); const routine = useRoutine(query.data?.routineId ?? undefined); const contact = useContact(query.data?.contactId ?? undefined); const run = useRun(query.data?.checklistRunId ?? undefined);
  const [confirm, setConfirm] = useState(false); const [picker, setPicker] = useState(false); const [selected, setSelected] = useState<ResourceOption | null>(null); const locked = useRef(false);
  const command = useMutation({ retry: false, mutationFn: (value: Command) => value.kind === 'status' ? api.status(id ?? '', value.status) : api.assign(id ?? '', value.assigneeId),
    onSuccess: async (task) => {
      if (manager.store.getState().status !== 'authenticated' || manager.store.getState().user?.id !== user?.id) return;
      client.setQueryData(['task', task.id, user?.id], task); setConfirm(false); setSelected(null); await Promise.all([client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['task-history', id] }), client.invalidateQueries({ queryKey: ['checklist-run', task.checklistRunId] })]);
    }, onError: () => { if (manager.store.getState().user?.id === user?.id) void client.invalidateQueries({ queryKey: ['task', id] }); }, onSettled: () => { locked.current = false; } });
  function send(value: Command) { if (locked.current) return; locked.current = true; command.mutate(value); }
  if (!id) return <EmptyState message={strings.tasks.notFound} />; if (query.isPending) return <LoadingState />;
  if (query.isError) return <View><AppText variant="caption" style={styles.error}>{taskError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  const task = query.data; const actions = taskActions(task, user); const busy = command.isPending || query.isRefetching;
  return <Screen><ScrollView contentContainerStyle={styles.content} accessibilityElementsHidden={picker} importantForAccessibility={picker ? 'no-hide-descendants' : 'auto'}><View style={styles.section}>
    <AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{task.title}</AppText><AppText variant="body">{strings.dashboard.status[task.status]} · {strings.dashboard.priority[task.priority]}</AppText>
    <AppText variant="body">{task.dueDate ? `${strings.tasks.dueDate}: ${displayDate(task.dueDate)}` : strings.dashboard.noDueDate}</AppText>{task.isOverdue && <AppText variant="caption" style={styles.error}>{strings.dashboard.overdue}</AppText>}
    <AppText variant="bodyStrong" style={styles.label}>{strings.tasks.assignee}</AppText><AppText variant="body">{task.assigneeId === user?.id ? user.name : owner.data?.name ?? strings.tasks.personUnknown}</AppText>
    <AppText variant="bodyStrong" style={styles.label}>{strings.tasks.creator}</AppText><AppText variant="body">{task.createdById === user?.id ? user.name : creator.data?.name ?? strings.tasks.personUnknown}</AppText>
    <AppText variant="bodyStrong" style={styles.label}>{strings.tasks.description}</AppText><AppText variant="body" style={styles.text}>{task.description}</AppText><AppText variant="bodyStrong" style={styles.label}>{strings.tasks.instructions}</AppText><AppText variant="body" style={styles.text}>{task.instructions}</AppText>
    {!!task.routineId && <Button label={routine.data?.title ?? strings.tasks.routine} variant="secondary" onPress={() => router.push({ pathname: '/rotina/[id]', params: { id: task.routineId ?? '' } })} />}
    {!!task.contactId && <Button label={contact.data?.name ?? strings.tasks.contact} variant="secondary" onPress={() => router.push({ pathname: '/contato/[id]', params: { id: task.contactId ?? '' } })} />}
    {!!task.checklistRunId && <Button label={run.data?.titleSnapshot ?? strings.tasks.run} variant="secondary" onPress={() => router.push({ pathname: '/execucao/[id]', params: { id: task.checklistRunId ?? '' } })} />}
    <Button label={strings.tasks.history} variant="secondary" onPress={() => router.push({ pathname: '/tarefa/[id]/historico', params: { id: task.id } })} />
    <Button label={strings.feedback.refresh} variant="secondary" disabled={command.isPending} onPress={() => void query.refetch()} />
    {command.isError && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{taskError(command.error)}</AppText>}
    {actions.start && <Button label={strings.tasks.start} loading={command.isPending} disabled={busy} onPress={() => send({ kind: 'status', status: 'EM_ANDAMENTO' })} />}
    {actions.complete && <Button label={strings.tasks.complete} loading={command.isPending} disabled={busy} onPress={() => send({ kind: 'status', status: 'CONCLUIDA' })} />}
    {actions.edit && <Button label={strings.tasks.edit} variant="secondary" disabled={busy} onPress={() => router.push({ pathname: '/tarefa/[id]/editar', params: { id: task.id } })} />}
    {actions.assign && (task.checklistRunId ? <AppText variant="body">{strings.tasks.assignmentLocked}</AppText> : <><Button label={strings.tasks.assign} variant="secondary" disabled={busy} onPress={() => setPicker(true)} />
      {!!selected && <><AppText variant="body">{selected.label}</AppText><Button label={strings.tasks.confirmAssign} loading={command.isPending} disabled={busy || selected.id === task.assigneeId} onPress={() => send({ kind: 'assign', assigneeId: selected.id })} /><Button label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => setSelected(null)} /></>}</>)}
    {actions.cancel && (!confirm ? <Button label={strings.tasks.cancelTask} variant="secondary" disabled={busy} onPress={() => setConfirm(true)} /> : <><AppText variant="body">{strings.tasks.cancelHelp}</AppText><Button label={strings.tasks.confirmCancel} loading={command.isPending} disabled={busy} onPress={() => send({ kind: 'status', status: 'CANCELADA' })} /><Button label={strings.routines.cancel} variant="secondary" disabled={busy} onPress={() => setConfirm(false)} /></>)}
  </View></ScrollView>{picker && <ResourcePicker kind="person" assigneeId={task.assigneeId} routineId={task.routineId} onSelect={(option) => { setSelected(option); setPicker(false); }} onClose={() => setPicker(false)} />}</Screen>;
}
export function TaskFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const styles = useStyles();
  const id = useId(); const { user } = useSession(); const query = useTask(mode === 'edit' ? id : undefined); const router = useRouter();
  if (mode === 'edit' && !id) return <EmptyState message={strings.tasks.notFound} />;
  if (mode === 'edit' && query.isPending) return <LoadingState />;
  if (mode === 'edit' && query.isError) return <View><AppText variant="caption" style={styles.error}>{taskError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  if (mode === 'edit' && query.data && !taskActions(query.data, user).edit) return <EmptyState message={query.data.status === 'CONCLUIDA' || query.data.status === 'CANCELADA' ? strings.tasks.closed : strings.tasks.forbidden} />;
  return <TaskForm key={mode === 'edit' ? id : 'new'} task={mode === 'edit' ? query.data : undefined} onSaved={(saved) => router.replace({ pathname: '/tarefa/[id]', params: { id: saved.id } })}
    onCancel={() => { if (mode === 'edit' && id) router.replace({ pathname: '/tarefa/[id]', params: { id } }); else router.replace('/tarefas'); }} />;
}
export function TaskHistoryScreen() {
  const styles = useStyles();
  const id = useId(); const query = useTaskHistory(id); const data = [...new Map((query.data?.pages.flatMap((page) => page.items) ?? []).map((event) => [event.id, event])).values()];
  if (!id) return <EmptyState message={strings.tasks.notFound} />; if (query.isPending) return <LoadingState />;
  if (query.isError && !query.data) return <View><AppText variant="caption" style={styles.error}>{taskError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  return <Screen><FlashList data={data} keyExtractor={(event) => event.id} contentContainerStyle={styles.content} renderItem={({ item }) => <EventRow event={item} />}
    ListEmptyComponent={<EmptyState message={strings.tasks.emptyHistory} />} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
    ListFooterComponent={<View style={styles.section}>{query.isError && <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />}{query.hasNextPage && <Button label={strings.feedback.loadMore} loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />}</View>} /></Screen>;
}
function EventRow({ event }: { event: TaskEventPage['items'][number] }) {
  const styles = useStyles();
  const { user } = useSession(); const actor = useTaskPerson(event.actorId); const previous = useTaskPerson(event.fromAssigneeId ?? undefined); const next = useTaskPerson(event.toAssigneeId ?? undefined);
  const name = (id: string | null, fallback?: string) => id === user?.id ? user?.name : fallback ?? strings.tasks.personUnknown;
  return <Card><AppText variant="bodyStrong" style={styles.label}>{strings.tasks.events[event.type]}</AppText><AppText variant="body">{name(event.actorId, actor.data?.name)} · {new Date(event.createdAt).toLocaleString('pt-BR')}</AppText>
    {!!event.fromStatus && !!event.toStatus && <AppText variant="body">{strings.dashboard.status[event.fromStatus]} → {strings.dashboard.status[event.toStatus]}</AppText>}
    {event.type === 'REASSIGNED' && <AppText variant="body">{name(event.fromAssigneeId, previous.data?.name)} → {name(event.toAssigneeId, next.data?.name)}</AppText>}
    {event.changedFields.map((field) => field === 'title' || field === 'description' || field === 'instructions' || field === 'priority' || field === 'dueDate' ? <AppText variant="body" key={field}>{strings.tasks.fields[field]}</AppText> : null)}
  </Card>;
}
