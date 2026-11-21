import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { TransitionSnapshot } from '@gabinete-plus/shared';
import { AppText, Avatar, Card, Chip, ChipGroup, EmptyState, ListGroup, ListRow, MarkdownContent, StatusBadge } from '../../components';
import { strings } from '../../lib/strings';
import { dimensions, radius, size, spacing } from '../../lib/theme';
import { useTheme } from '../../providers/theme-provider';
import type { TransitionRow } from './model';

const copy = strings.transition;
type SectionKey = keyof TransitionSnapshot['content'];
const sectionIndex = [
  { key: 'overview', title: copy.overview, short: copy.overview },
  { key: 'routines', title: copy.sections.ROUTINES, short: strings.nav.routines },
  { key: 'guidelines', title: copy.sections.GUIDELINES, short: strings.nav.guidelines },
  { key: 'contacts', title: copy.sections.CONTACTS, short: strings.nav.contacts },
  { key: 'tasks', title: copy.sections.TASKS, short: strings.nav.tasks },
  { key: 'notes', title: copy.notes, short: copy.shortNotes },
] satisfies { key: SectionKey; title: string; short: string }[];

export function TransitionSections({ expanded, header, content }: {
  expanded: boolean; header: ReactNode; content: Record<SectionKey, ReactNode>;
}) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<SectionKey>('overview');
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef(new Map<SectionKey, number>());
  const sections = (start: number, end?: number) => sectionIndex.slice(start, end).map(({ key, title }, index) => (
    <View key={key} style={styles.section}
      onLayout={expanded ? undefined : (event) => offsets.current.set(key, event.nativeEvent.layout.y)}>
      <View style={styles.heading}>
        <View style={[styles.number, { backgroundColor: colors.brandSoft }]} aria-hidden>
          <AppText variant="data" color="brandText">{start + index + 1}</AppText>
        </View>
        <AppText variant="title" accessibilityRole="header" style={styles.headingText}>{title}</AppText>
      </View>
      {content[key]}
    </View>
  ));
  return (
    <ScrollView ref={scroll} contentContainerStyle={[styles.content, expanded && styles.page]}>
      <View style={styles.header}>
        {header}
        {!expanded && (
          <ChipGroup label={copy.sectionIndex} selection="radio" horizontal>
            {sectionIndex.map(({ key, short }, index) => (
              <Chip key={key} label={copy.numberedSection(index + 1, short)} mode="radio" selected={key === selected} onPress={() => {
                const y = offsets.current.get(key);
                if (y !== undefined) {
                  setSelected(key);
                  scroll.current?.scrollTo({ y: Math.max(0, y - spacing.space4), animated: true });
                }
              }} />
            ))}
          </ChipGroup>
        )}
      </View>
      {expanded ? <View style={styles.grid}>
        <View style={styles.gridColumn}>{sections(0, 3)}</View>
        <View style={styles.gridColumn}>{sections(3)}</View>
      </View> : sections(0)}
    </ScrollView>
  );
}

export function TransitionText({ content }: { content: string }) {
  return content ? <Card><MarkdownContent content={content} /></Card> : <EmptyState message={copy.empty} />;
}

export function TransitionList({ items, onOpen }: { items: TransitionRow[]; onOpen: (item: TransitionRow, trigger?: View) => void }) {
  const triggers = useRef(new Map<string, View>());
  if (!items.length) return <EmptyState message={copy.empty} />;
  return (
    <ListGroup>
      {items.map((item) => (
        <ListRow key={item.id} ref={(node) => { if (node) triggers.current.set(item.id, node); else triggers.current.delete(item.id); }}
          title={item.title} description={item.description} descriptionLines={item.task ? undefined : 1} icon={item.icon}
          start={item.icon ? undefined : <Avatar name={item.title} />}
          end={item.task && <StatusBadge status={item.task.status} overdue={item.task.isOverdue} />}
          onPress={() => onOpen(item, triggers.current.get(item.id))} />
      ))}
    </ListGroup>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space6 },
  page: { maxWidth: dimensions.pageMax, padding: spacing.space8 },
  header: { gap: spacing.space3 },
  grid: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space8 },
  gridColumn: { flex: 1, minWidth: 0, gap: spacing.space8 },
  section: { gap: spacing.space3 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.space3 },
  headingText: { flex: 1 },
  number: {
    width: dimensions.smallAvatar, height: dimensions.smallAvatar, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
  },
});
