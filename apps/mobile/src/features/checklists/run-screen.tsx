import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema, type ChecklistRun } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Avatar, Banner, Button, Card, Checkbox, EmptyState, ErrorState, FooterBar, Icon, IconButton,
  LoadingState, MarkdownContent, ProgressBar, Screen, Sheet, StatusBadge, Tag,
} from '../../components';
import { ListGroupItem } from '../../components/list-group';
import { strings } from '../../lib/strings';
import { breakpoint, dimensions, iconSize, line, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { displayDate } from '../dashboard/model';
import { useTask } from '../tasks/hooks';
import { checklistError, useChecklistPersonName, useMarkItem, useRun } from './hooks';

const copy = strings.checklists;
const shortDate = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
const time = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

function RunSummary({ run, owner, chief }: { run: ChecklistRun; owner: boolean; chief: boolean }) {
  const { colors } = useTheme();
  const name = useChecklistPersonName(run.assigneeId);
  return (
    <Card>
      <View style={styles.status}>
        <StatusBadge status={run.status} />
        <AppText variant="data" color="inkMuted">{displayDate(run.periodStart)}</AppText>
      </View>
      <AppText variant="title" accessibilityRole="header">{run.titleSnapshot}</AppText>
      <ProgressBar completed={run.completedItems} total={run.totalItems} label={copy.progressLabel} />
      <View style={[styles.person, { borderTopColor: colors.border }]}>
        <Avatar size="sm" name={name === copy.personUnavailable ? undefined : name} />
        <View style={styles.personCopy}>
          <AppText variant="label">{name}</AppText>
          {owner || chief ? <AppText variant="caption" color="inkMuted">{owner ? copy.owner : copy.chiefCanMark}</AppText> : null}
        </View>
      </View>
    </Card>
  );
}

function RunItem({ item, disabled, onChange }: {
  item: ChecklistRun['items'][number]; disabled: boolean; onChange: (done: boolean) => void;
}) {
  const author = useChecklistPersonName(item.completedById ?? undefined);
  const date = item.completedAt ? new Date(item.completedAt) : undefined;
  const attribution = item.completedById && date ? copy.marked(author, copy.markTime(shortDate.format(date), time.format(date))) : undefined;
  return <Checkbox label={item.text} checked={item.isCompleted} disabled={disabled} attribution={attribution} onChange={onChange} />;
}

export function ChecklistRunScreen() {
  const { id, taskId } = useLocalSearchParams();
  const runParams = userIdParamsSchema.safeParse({ id });
  const taskParams = userIdParamsSchema.safeParse({ id: taskId });
  const runId = runParams.success ? runParams.data.id : undefined;
  return <ChecklistRunDetail key={runId} id={runId} taskId={taskParams.success ? taskParams.data.id : undefined} />;
}

function ChecklistRunDetail({ id, taskId }: { id?: string; taskId?: string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user } = useSession();
  const query = useRun(id);
  const mark = useMarkItem(id);
  const { data: run } = query;
  const task = useTask(run ? taskId : undefined);
  const [showInstructions, setShowInstructions] = useState(false);
  const instructionsRef = useRef<View>(null);
  const wide = width >= breakpoint.large;
  const linkedTask = run && task.data?.checklistRunId === run.id && !task.isError ? task.data : undefined;
  const owner = !!run && run.assigneeId === user?.id;
  const chief = user?.role === 'CHEFE';
  const editable = chief || owner;
  const complete = run?.status === 'CONCLUIDA';
  const closedTask = linkedTask?.status === 'CONCLUIDA';
  const taskReady = linkedTask && !closedTask && linkedTask.status !== 'CANCELADA';
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/execucoes'); };
  const instructions = () => setShowInstructions(true);

  return (
    <Screen>
      {(!wide || !run) && <AppBar title={copy.run} subtitle={run?.routineTitleSnapshot} onBack={back}
        action={run && <IconButton ref={instructionsRef} label={copy.showInstructions} icon="book-open" onPress={instructions} />} />}
      {!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
        <ErrorState message={checklistError(query.error)} retry={() => void query.refetch()} />
      ) : run && (
        <>
          <View style={[styles.column, wide && styles.wideColumn]}>
            <FlashList data={run.items} keyExtractor={(item) => item.id} contentContainerStyle={[styles.content, wide && styles.wideContent]}
              refreshing={query.isRefetching} onRefresh={() => void query.refetch()} showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.header}>
                  {wide && (
                    <View style={styles.wideHeader}>
                      <View style={styles.wideIdentity}>
                        <IconButton label={strings.nav.back} icon="arrow-left" onPress={back} />
                        <View style={styles.wideTitle}>
                          <AppText variant="titleLg" accessibilityRole="header">{copy.run}</AppText>
                          <AppText variant="body" color="inkMuted">{run.routineTitleSnapshot}</AppText>
                        </View>
                      </View>
                      <Button ref={instructionsRef} label={copy.showInstructions} icon="book-open" variant="secondary" onPress={instructions} />
                    </View>
                  )}
                  {complete && <Banner tone="success" message={taskReady ? copy.completeWithTask : copy.complete} />}
                  {!editable && <Banner tone="neutral" message={copy.readOnly} icon="lock" />}
                  {closedTask && <Banner tone="neutral" message={copy.completedTask} icon="lock" />}
                  {mark.isError && <Banner tone="danger" message={checklistError(mark.error)} />}
                  <RunSummary run={run} owner={owner} chief={chief} />
                </View>
              }
              renderItem={({ item, index }) => (
                <ListGroupItem first={index === 0} last={index === run.items.length - 1} divider>
                  <RunItem item={item} onChange={(done) => mark.mark(item.id, done)}
                    disabled={!editable || closedTask || mark.isPending || query.isRefetching} />
                </ListGroupItem>
              )}
              ListEmptyComponent={<EmptyState icon="list" message={copy.emptyItems} />}
              ListFooterComponent={
                <View style={styles.footer}>
                  <View style={styles.note}>
                    <Icon name="lock" size={iconSize.extraSmall} color="inkMuted" />
                    <AppText variant="caption" color="inkMuted" style={styles.personCopy}>{copy.snapshot}</AppText>
                  </View>
                  {complete && taskId && task.isPending && <LoadingState />}
                  {complete && taskId && task.isError && <ErrorState updating retry={() => void task.refetch()} />}
                </View>
              }
            />
          </View>
          {complete && linkedTask && <FooterBar>
            <Button label={copy.openLinkedTask} icon="check-square"
              onPress={() => router.push({ pathname: '/tarefa/[id]', params: { id: linkedTask.id } })} />
          </FooterBar>}
          <Sheet visible={showInstructions} title={copy.instructionsSnapshot} returnFocusRef={instructionsRef}
            onDismiss={() => setShowInstructions(false)}>
            <ScrollView contentContainerStyle={styles.instructions}>
              <Tag label={copy.version(run.templateVersion)} />
              {run.instructionsSnapshot ? <MarkdownContent content={run.instructionsSnapshot} />
                : <AppText variant="body" color="inkMuted">{copy.noInstructions}</AppText>}
            </ScrollView>
          </Sheet>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, alignSelf: 'center', width: '100%', maxWidth: size.contentMax },
  wideColumn: { maxWidth: dimensions.checklistRunMax },
  content: { padding: spacing.space4 },
  wideContent: { padding: spacing.space8 },
  header: { gap: spacing.space4, paddingBottom: spacing.space4 },
  wideHeader: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.space3, paddingBottom: spacing.space2 },
  wideIdentity: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0, gap: spacing.space2 },
  wideTitle: { flexShrink: 1, minWidth: 0, gap: spacing.space1 },
  status: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.space2 },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2, borderTopWidth: line.thin, paddingTop: spacing.space3 },
  personCopy: { flex: 1, minWidth: 0 },
  footer: { gap: spacing.space3, paddingTop: spacing.space4 },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
  instructions: { gap: spacing.space3 },
});
