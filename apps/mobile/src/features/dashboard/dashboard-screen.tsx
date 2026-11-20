import { Link, useRouter, type Href } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText, Button, EmptyState, ErrorState, Fab, IconButton, ListGroup, ListRow, LoadingState, Screen, Section } from '../../components';
import { Control } from '../../components/control';
import { strings } from '../../lib/strings';
import { breakpoint, dimensions, radius, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { TaskCard } from './cards';
import { useDashboardQueries, useGabineteDate } from './hooks';
import { displayDate, pendingPreview } from './model';

const todayRoutines = { pathname: '/rotinas', params: { scope: 'today' } } satisfies Href;

function SectionLink({ label, href }: { label: string; href: Href }) {
  const { colors } = useTheme();
  return (
    <Link href={href} push asChild>
      <Control accessibilityRole="link" accessibilityLabel={label} style={styles.link} pressedStyle={{ backgroundColor: colors.brandSoft }}>
        <AppText variant="label" color="brandText">{strings.dashboard.viewAll}</AppText>
      </Control>
    </Link>
  );
}

export function DashboardScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktop = width >= breakpoint.large;
  const tablet = width >= breakpoint.medium && !desktop;
  const { user } = useSession();
  const router = useRouter();
  const day = useGabineteDate();
  const { open, progress, routines } = useDashboardQueries(day);
  const retryTasks = () => { void open.refetch(); void progress.refetch(); };
  const refresh = () => { retryTasks(); void routines.refetch(); };
  const refreshing = open.isRefetching || progress.isRefetching || routines.isRefetching;
  const tasks = pendingPreview(open.data?.items ?? [], progress.data?.items ?? [], user?.id ?? '');
  const tasksLoading = open.isPending || progress.isPending;
  const tasksFailed = open.isError || progress.isError;
  const hasMoreTasks = !!open.data?.nextCursor || !!progress.data?.nextCursor || (open.data?.items.length ?? 0) + (progress.data?.items.length ?? 0) > 5;

  if (!user) return null;
  const createTask = () => router.push('/tarefa/nova');
  const date = displayDate(day, { weekday: 'long', day: 'numeric', month: 'long' });
  const firstName = user.name.trim().split(/\s+/, 1)[0] || user.name;

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.brand]} tintColor={colors.brand} progressBackgroundColor={colors.surface} />}
      >
        <View style={[styles.page, desktop && styles.desktopPage]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="label" color="inkMuted">{date.charAt(0).toLocaleUpperCase('pt-BR') + date.slice(1)}</AppText>
              <AppText accessibilityRole="header" variant="display">{strings.dashboard.greeting(firstName)}</AppText>
            </View>
            {desktop ? (
              <View style={styles.headerActions}>
                <Button label={strings.feedback.refresh} variant="secondary" icon="refresh-cw" onPress={refresh} loading={refreshing} />
                <Button label={strings.tasks.create} icon="plus" onPress={createTask} />
              </View>
            ) : <IconButton label={strings.feedback.refresh} icon="refresh-cw" onPress={refresh} disabled={refreshing} />}
          </View>
          <View style={[styles.sections, tablet && styles.tabletSections, desktop && styles.columns]}>
            <View style={desktop && styles.column}>
              <Section
                title={strings.dashboard.tasksTitle}
                description={strings.dashboard.tasksDescription}
                action={<SectionLink label={strings.dashboard.viewTasks} href="/tarefas" />}
              >
                {tasksLoading && <LoadingState />}
                {!tasksLoading && tasksFailed && <ErrorState retry={retryTasks} />}
                {!tasksLoading && !tasksFailed && (tasks.length ? tasks.map((task) => (
                  <TaskCard key={task.id} task={task} referenceDay={day} onPress={() => router.push({ pathname: '/tarefa/[id]', params: { id: task.id } })} />
                )) : <EmptyState message={strings.dashboard.emptyTasks} />)}
                {hasMoreTasks && !tasksFailed && <AppText variant="caption" color="inkMuted">{strings.dashboard.moreTasks}</AppText>}
              </Section>
            </View>
            <View style={desktop && styles.column}>
              <Section
                title={strings.dashboard.routinesTitle}
                description={strings.dashboard.routinesDescription}
                action={<SectionLink label={strings.dashboard.viewRoutines} href={todayRoutines} />}
              >
                {routines.isPending ? <LoadingState /> : routines.isError ? <ErrorState retry={() => void routines.refetch()} /> : routines.data.items.length ? (
                  <ListGroup>
                    {routines.data.items.map((routine) => (
                      <ListRow
                        key={routine.id}
                        title={routine.title}
                        description={strings.dashboard.routineSummary(strings.dashboard.frequency[routine.frequency], routine.category)}
                        icon="repeat"
                        onPress={() => router.push({ pathname: '/rotina/[id]', params: { id: routine.id } })}
                      />
                    ))}
                  </ListGroup>
                ) : <EmptyState message={strings.dashboard.emptyRoutines} />}
                {!!routines.data?.nextCursor && !routines.isError && <AppText variant="caption" color="inkMuted">{strings.dashboard.moreRoutines}</AppText>}
              </Section>
            </View>
          </View>
        </View>
      </ScrollView>
      {!desktop && <Fab label={strings.tasks.create} onPress={createTask} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%', alignSelf: 'center', gap: spacing.space2, paddingTop: spacing.space4,
    paddingHorizontal: spacing.space4, paddingBottom: dimensions.fab + spacing.space10,
  },
  desktopPage: { maxWidth: dimensions.pageMax, paddingTop: spacing.space8, paddingBottom: spacing.space8, paddingHorizontal: spacing.space8, gap: spacing.space4 },
  header: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.space3,
  },
  headerText: { flexShrink: 1, minWidth: 0, gap: spacing.space1 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space3 },
  sections: { gap: spacing.space6, maxWidth: size.contentMax, width: '100%', alignSelf: 'center' },
  tabletSections: { paddingHorizontal: spacing.space3 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space5, maxWidth: '100%' },
  column: { flex: 1, minWidth: 0 },
  link: { minHeight: size.touchTarget, justifyContent: 'center', borderRadius: radius.sm },
});
