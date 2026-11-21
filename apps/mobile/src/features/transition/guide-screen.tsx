import { useRef, useState, type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { transitionGuideSchema, type Task } from '@gabinete-plus/shared';
import { z } from 'zod';
import {
  AppBar, AppText, Avatar, Button, Card, Chip, ChipGroup, EmptyState, ErrorState, FooterBar, IconButton, ListGroup, ListRow,
  LoadingState, MarkdownContent, Screen, StatusBadge, type IconName,
} from '../../components';
import { strings } from '../../lib/strings';
import { breakpoint, dimensions, radius, size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { useTheme } from '../../providers/theme-provider';
import { displayDate } from '../dashboard/model';
import { errorMessage, useGuideSection } from './hooks';

const copy = strings.transition;
type GuideSection = z.infer<typeof transitionGuideSchema>['section'];
type SectionQuery = ReturnType<typeof useGuideSection>;
type Row = { id: string; title: string; description: string; href: Href; icon?: IconName; task?: Pick<Task, 'isOverdue' | 'status'> };

function rows(section: GuideSection): Row[] {
  switch (section.kind) {
    case 'ROUTINES':
      return section.items.map((item) => ({
        id: item.id, title: item.title, description: strings.routines.metadata(strings.dashboard.frequency[item.frequency], item.category),
        href: { pathname: '/rotina/[id]', params: { id: item.id } }, icon: 'repeat',
      }));
    case 'GUIDELINES':
      return section.items.map((item) => ({
        id: item.id, title: item.title, description: strings.routines.metadata(strings.guidelines.categories[item.category], strings.guidelines.version(item.version)),
        href: { pathname: '/orientacao/[id]', params: { id: item.id } }, icon: 'book-open',
      }));
    case 'CONTACTS':
      return section.items.map((item) => ({
        id: item.id, title: item.name, description: item.jobTitle ? strings.routines.metadata(item.organization, item.jobTitle) : item.organization,
        href: { pathname: '/contato/[id]', params: { id: item.id } },
      }));
    case 'TASKS':
      return section.items.map((item) => ({
        id: item.id, title: item.title,
        description: copy.taskMetadata(item.assigneeName, item.dueDate
          ? displayDate(item.dueDate, { day: '2-digit', month: '2-digit' }) : strings.contacts.noInformation),
        href: { pathname: '/tarefa/[id]', params: { id: item.id } }, icon: 'check-square', task: item,
      }));
  }
}

function SectionContent({ query }: { query: SectionQuery }) {
  const router = useRouter();
  if (query.isPending) return <LoadingState />;
  if (query.isError && !query.data) return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  const entries = query.data?.pages.flatMap(({ section }) => rows(section)) ?? [];
  const items = [...new Map(entries.map((item) => [item.id, item])).values()];
  const retry = () => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); };
  return (
    <>
      {items.length ? <ListGroup>
        {items.map((item) => (
          <ListRow key={item.id} title={item.title} description={item.description} descriptionLines={item.task ? undefined : 1} icon={item.icon}
            start={item.icon ? undefined : <Avatar name={item.title} />}
            end={item.task && <StatusBadge status={item.task.status} overdue={item.task.isOverdue} />}
            onPress={() => router.push(item.href)} />
        ))}
      </ListGroup> : <EmptyState message={copy.empty} />}
      {query.isError && <ErrorState updating retry={retry} />}
      {query.hasNextPage && <Button label={strings.feedback.loadMore} variant="ghost" loading={query.isFetchingNextPage}
        disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}
    </>
  );
}

function GuideText({ field, query }: { field: 'overview' | 'notes'; query: SectionQuery }) {
  const settings = query.data?.pages[0]?.settings;
  if (query.isPending) return <LoadingState />;
  if (query.isError && !settings) return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  const content = settings?.[field];
  return content ? <Card><MarkdownContent content={content} /></Card> : <EmptyState message={copy.empty} />;
}

function NumberedSection({ number, title, children }: PropsWithChildren<{ number: number; title: string }>) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={[styles.number, { backgroundColor: colors.brandSoft }]} aria-hidden>
          <AppText variant="data" color="brandText">{number}</AppText>
        </View>
        <AppText variant="title" accessibilityRole="header" style={styles.headingText}>{title}</AppText>
      </View>
      {children}
    </View>
  );
}

export function TransitionGuideScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const expanded = width >= breakpoint.expanded;
  const canCurate = user?.role === 'CHEFE';
  const routines = useGuideSection('ROUTINES');
  const guidelines = useGuideSection('GUIDELINES');
  const contacts = useGuideSection('CONTACTS');
  const tasks = useGuideSection('TASKS');
  const [selected, setSelected] = useState(1);
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef(new Map<number, number>());
  const entries = [
    { number: 1, title: copy.overview, short: copy.overview, content: <GuideText field="overview" query={routines} /> },
    { number: 2, title: copy.sections.ROUTINES, short: strings.nav.routines, content: <SectionContent query={routines} /> },
    { number: 3, title: copy.sections.GUIDELINES, short: strings.nav.guidelines, content: <SectionContent query={guidelines} /> },
    { number: 4, title: copy.sections.CONTACTS, short: strings.nav.contacts, content: <SectionContent query={contacts} /> },
    { number: 5, title: copy.sections.TASKS, short: strings.nav.tasks, content: <SectionContent query={tasks} /> },
    { number: 6, title: copy.notes, short: copy.notes, content: <GuideText field="notes" query={routines} /> },
  ];
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/gabinete'); };
  const copies = () => router.push('/transicao/copias');
  const curate = () => router.push('/transicao/preparar');
  const sections = (items: typeof entries) => items.map(({ number, title, content }) => (
    <View key={number} onLayout={expanded ? undefined : (event) => offsets.current.set(number, event.nativeEvent.layout.y)}>
      <NumberedSection number={number} title={title}>{content}</NumberedSection>
    </View>
  ));

  return (
    <Screen>
      {!expanded && <AppBar title={copy.title} onBack={back} action={<IconButton label={copy.copies} icon="layers" onPress={copies} />} />}
      <ScrollView ref={scroll} contentContainerStyle={[styles.content, expanded && styles.page]}>
        <View style={styles.header}>
          {expanded && <AppText variant="titleLg" accessibilityRole="header">{copy.title}</AppText>}
          <AppText variant="body" color="inkMuted">{copy.introduction}</AppText>
          {expanded ? (
            <View style={styles.actions}>
              <Button label={copy.copies} icon="layers" variant="secondary" onPress={copies} />
              {canCurate && <Button label={copy.curate} icon="edit-2" onPress={curate} />}
            </View>
          ) : (
            <ChipGroup label={copy.sectionIndex} selection="radio" horizontal>
              {entries.map(({ number, short }) => (
                <Chip key={number} label={copy.numberedSection(number, short)} mode="radio"
                  selected={number === selected} onPress={() => {
                    const y = offsets.current.get(number);
                    if (y !== undefined) {
                      setSelected(number);
                      scroll.current?.scrollTo({ y: Math.max(0, y - spacing.space4), animated: true });
                    }
                  }} />
              ))}
            </ChipGroup>
          )}
        </View>
        {expanded ? <View style={styles.grid}>
          <View style={styles.gridColumn}>{sections(entries.slice(0, 3))}</View>
          <View style={styles.gridColumn}>{sections(entries.slice(3))}</View>
        </View> : sections(entries)}
      </ScrollView>
      {!expanded && canCurate && <FooterBar><Button label={copy.curate} icon="edit-2" onPress={curate} /></FooterBar>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space6 },
  page: { maxWidth: dimensions.pageMax, padding: spacing.space8 },
  header: { gap: spacing.space3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space3 },
  grid: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space8 },
  gridColumn: { flex: 1, minWidth: 0, gap: spacing.space8 },
  section: { gap: spacing.space3 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.space3 },
  headingText: { flex: 1 },
  number: {
    width: dimensions.smallAvatar, height: dimensions.smallAvatar, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
  },
});
