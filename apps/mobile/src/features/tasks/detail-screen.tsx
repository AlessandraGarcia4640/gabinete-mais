import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task, UserSummary } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Avatar, Banner, Button, Card, Dialog, EmptyState, ErrorState, FooterBar, Icon,
  IconButton, KeyValueList, ListGroup, ListRow, LoadingState, MarkdownContent, PriorityTag, Screen,
  Section, Sheet, StatusBadge,
} from '../../components';
import { useSplitView } from '../../components/split-view';
import { strings } from '../../lib/strings';
import { breakpoint, iconSize, size, spacing } from '../../lib/theme';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { useRun } from '../checklists/hooks';
import { useContact } from '../contacts/hooks';
import { useGabineteDate } from '../dashboard/hooks';
import { displayDate } from '../dashboard/model';
import { useRoutine } from '../routines/hooks';
import type { ResourceOption } from './api';
import { taskError, useTask, useTaskPerson, useTasksApi } from './hooks';
import { taskActions } from './model';
import { ResourcePicker } from './picker';

const copy = strings.tasks;
type Command = { kind: 'status'; status: Task['status'] } | { kind: 'assign'; assigneeId: string };

function PersonSummary({ person, showRole }: { person?: UserSummary; showRole?: boolean }) {
  return (
    <View style={styles.person}>
      <Avatar name={person?.name} size="sm" />
      <View style={styles.personName}>
        <AppText variant="label">{person?.name ?? copy.personUnknown}</AppText>
        {showRole && person && <AppText variant="caption" color="inkMuted">{strings.session.roles[person.role]}</AppText>}
      </View>
    </View>
  );
}

export function TaskDetail({ id }: { id?: string }) {
  const query = useTask(id);
  const { user } = useSession();
  const manager = useSessionManager();
  const client = useQueryClient();
  const api = useTasksApi();
  const router = useRouter();
  const split = useSplitView();
  const { width } = useWindowDimensions();
  const columns = split && width >= breakpoint.large;
  const day = useGabineteDate();
  const owner = useTaskPerson(query.data?.assigneeId);
  const creator = useTaskPerson(query.data?.createdById);
  const routine = useRoutine(query.data?.routineId ?? undefined);
  const contact = useContact(query.data?.contactId ?? undefined);
  const run = useRun(query.data?.checklistRunId ?? undefined);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selected, setSelected] = useState<ResourceOption | null>(null);
  const locked = useRef(false);
  const menuRef = useRef<View>(null);
  const assignRef = useRef<View>(null);
  const command = useMutation({
    retry: false,
    mutationFn: (value: Command) => value.kind === 'status' ? api.status(id ?? '', value.status) : api.assign(id ?? '', value.assigneeId),
    onSuccess: async (task) => {
      if (manager.store.getState().status !== 'authenticated' || manager.store.getState().user?.id !== user?.id) return;
      client.setQueryData(['task', task.id, user?.id], task);
      setConfirm(false);
      setPicker(false);
      setSelected(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['tasks'] }),
        client.invalidateQueries({ queryKey: ['task-history', id] }),
        client.invalidateQueries({ queryKey: ['checklist-run', task.checklistRunId] }),
      ]);
    },
    onError: () => { if (manager.store.getState().user?.id === user?.id) void client.invalidateQueries({ queryKey: ['task', id] }); },
    onSettled: () => { locked.current = false; },
  });

  function send(value: Command) {
    if (locked.current) return;
    locked.current = true;
    command.mutate(value);
  }

  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/tarefas'); };
  const basicHeader = !split && <AppBar title={copy.details} onBack={back} />;
  if (!id) return <Screen>{basicHeader}<EmptyState message={copy.notFound} /></Screen>;
  if (query.isPending) return <Screen>{basicHeader}<LoadingState /></Screen>;
  if (query.isError) return <Screen>{basicHeader}<ErrorState message={taskError(query.error)} retry={() => void query.refetch()} /></Screen>;

  const task = query.data;
  const actions = taskActions(task, user);
  const busy = command.isPending || query.isRefetching;
  const closed = task.status === 'CONCLUIDA' || task.status === 'CANCELADA';
  const assignmentLocked = !!task.checklistRunId;
  const checklistReady = !task.checklistRunId || run.data?.status === 'CONCLUIDA';
  const checklistWarning = run.data && !checklistReady ? copy.incomplete : run.isError ? copy.reviewLinkedChecklist : undefined;
  const error = command.error ? taskError(command.error) : undefined;
  const due = task.dueDate ? displayDate(task.dueDate) : strings.dashboard.noDueDate;
  const dueToday = task.dueDate === day;
  const progress = run.data && strings.checklists.progress(run.data.completedItems, run.data.totalItems);
  const edit = () => router.push({ pathname: '/tarefa/[id]/editar', params: { id: task.id } });
  const history = () => router.push({ pathname: '/tarefa/[id]/historico', params: { id: task.id } });
  const more = <IconButton label={strings.nav.more} icon="more-vertical" ref={menuRef} disabled={command.isPending} onPress={() => setMenu(true)} />;
  const assignment = actions.assign && (
    <Button ref={assignRef} label={copy.assign} icon="users" variant="secondary" size={split ? 'sm' : undefined}
      disabled={busy || assignmentLocked} onPress={() => { command.reset(); setSelected(null); setPicker(true); }} />
  );
  const status = (actions.start || actions.complete) && (
    <Button label={actions.start ? copy.start : copy.complete} icon={split ? 'check' : undefined} size={split ? 'sm' : undefined}
      disabled={busy || (actions.complete && !checklistReady)}
      loading={command.isPending && command.variables?.kind === 'status' && !confirm}
      onPress={() => send({ kind: 'status', status: actions.start ? 'EM_ANDAMENTO' : 'CONCLUIDA' })} />
  );
  const facts = <Card><KeyValueList items={[
    { label: copy.assignee, value: <PersonSummary person={task.assigneeId === user?.id ? user : owner.data} showRole /> },
    { label: copy.creator, value: <PersonSummary person={task.createdById === user?.id ? user : creator.data} /> },
    { label: copy.dueDate, value: due, data: !!task.dueDate },
    { label: copy.priority, value: <PriorityTag priority={task.priority} /> },
  ]} /></Card>;
  const warning = !closed && (
    <>
      {actions.complete && checklistWarning && <Banner tone="warn" message={checklistWarning} />}
      {actions.assign && assignmentLocked && <AppText variant="caption" color="inkMuted">{copy.assignmentLocked}</AppText>}
    </>
  );
  const bindings = (
    <Section title={copy.links}>
      <ListGroup>
        {task.routineId && (
          <ListRow title={routine.data?.title ?? copy.routine} description={routine.data ? copy.routine : undefined} icon="repeat"
            onPress={() => router.push({ pathname: '/rotina/[id]', params: { id: task.routineId ?? '' } })} />
        )}
        {task.checklistRunId && (
          <ListRow title={run.data?.titleSnapshot ?? copy.run} description={progress && copy.checklistSummary(progress)} icon="list"
            end={run.data && <StatusBadge status={run.data.status} label={strings.checklists.progressFraction(run.data.completedItems, run.data.totalItems)} />}
            onPress={() => router.push({ pathname: '/execucao/[id]', params: { id: task.checklistRunId ?? '', taskId: task.id } })} />
        )}
        {task.contactId && (
          <ListRow title={contact.data?.name ?? copy.contact} description={contact.data ? copy.contact : undefined} icon="users"
            onPress={() => router.push({ pathname: '/contato/[id]', params: { id: task.contactId ?? '' } })} />
        )}
        <ListRow title={copy.history} description={copy.historySummary} icon="clock" onPress={history} />
      </ListGroup>
    </Section>
  );
  const instructions = (
    <Section title={copy.instructions}>
      <Card>
        {task.instructions ? <MarkdownContent content={task.instructions} /> : <AppText variant="body" color="inkMuted">{copy.noInstructions}</AppText>}
      </Card>
    </Section>
  );
  return (
    <Screen>
      {!split && <AppBar title={copy.details} onBack={back} action={
        <View style={styles.inline}>
          {actions.edit && <IconButton label={copy.edit} icon="edit-2" disabled={busy} onPress={edit} />}
          {more}
        </View>
      } />}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, columns && styles.wideContent]}>
        {split && (
          <View style={styles.toolbar}>
            <Button label={copy.historyAction} size="sm" variant="ghost" icon="clock" onPress={history} />
            {actions.edit && <Button label={copy.editAction} size="sm" variant="secondary" icon="edit-2" disabled={busy} onPress={edit} />}
            {assignment}
            {status}
            {more}
          </View>
        )}
        <View style={styles.description}>
          <View style={styles.inline}>
            <StatusBadge status={task.status} overdue={task.isOverdue} />
            <PriorityTag priority={task.priority} />
            <View style={styles.inline}>
              <Icon name="calendar" color={task.isOverdue ? 'danger' : dueToday ? 'accentText' : 'inkMuted'} size={iconSize.extraSmall} />
              <AppText variant="caption" emphasis color={task.isOverdue ? 'danger' : dueToday ? 'accentText' : 'inkMuted'}>
                {task.dueDate ? (dueToday ? copy.todayDeadline(due) : copy.deadlineSummary(due)) : due}
              </AppText>
            </View>
          </View>
          <AppText variant="titleLg" accessibilityRole="header">{task.title}</AppText>
          {!!task.description && <AppText variant="body" color="inkMuted">{task.description}</AppText>}
        </View>
        {closed && <Banner tone="neutral" message={copy.closed} />}
        {!!error && !picker && !confirm && <Banner tone={error === copy.incomplete ? 'warn' : 'danger'} message={error} />}
        {columns ? (
          <>
            {warning}
            <View style={styles.columns}>
              <View style={styles.column}>{instructions}</View>
              <View style={styles.column}>{facts}{bindings}</View>
            </View>
          </>
        ) : <>{facts}{warning}{instructions}{bindings}</>}
      </ScrollView>
      {!split && (assignment || status) && <FooterBar>{assignment}{status}</FooterBar>}
      <Sheet title={strings.nav.more} visible={menu} onDismiss={() => setMenu(false)} returnFocusRef={menuRef}>
        <Button label={strings.feedback.refresh} variant="secondary" icon="refresh-cw" disabled={busy}
          onPress={() => { setMenu(false); void query.refetch(); }} />
        {actions.cancel && <Button label={copy.cancelTask} variant="dangerGhost" icon="x-circle" disabled={busy}
          onPress={() => { setMenu(false); command.reset(); setConfirm(true); }} />}
      </Sheet>
      <Dialog title={copy.cancelTitle} visible={confirm} message={copy.cancelHelp} error={error}
        confirmLabel={copy.confirmCancel} dismissLabel={copy.keepTask} busy={command.isPending}
        returnFocusRef={menuRef} onDismiss={() => setConfirm(false)}
        onConfirm={() => { if (actions.cancel) send({ kind: 'status', status: 'CANCELADA' }); }} />
      <ResourcePicker kind="person" visible={picker} assigneeId={task.assigneeId} routineId={task.routineId}
        returnFocusRef={assignRef} onClose={() => { setPicker(false); setSelected(null); }} onSelect={setSelected}
        confirmation={{
          selectedId: selected?.id, pending: command.isPending && command.variables?.kind === 'assign', error,
          onConfirm: () => { if (selected && actions.assign && !assignmentLocked) send({ kind: 'assign', assigneeId: selected.id }); },
        }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space6,
  },
  wideContent: { padding: spacing.space8 },
  description: { gap: spacing.space3 },
  inline: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.space2 },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
  personName: { flex: 1, minWidth: 0 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.space2 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space5 },
  column: { flex: 1, minWidth: 0, gap: spacing.space6 },
});
