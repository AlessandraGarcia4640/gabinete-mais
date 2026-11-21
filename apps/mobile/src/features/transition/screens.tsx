import { AppText } from '../../components/app-text';
import { useState } from 'react';
import { View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { transitionSectionSchema, userIdParamsSchema, type TransitionSnapshot } from '@gabinete-plus/shared';
import { Choice, Screen, Card, EmptyState, ErrorState, LoadingState } from '../../components';
import { MarkdownContent } from '../../components/markdown-content';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { useStyles } from '../tasks/styles';
import { errorMessage, useTransitionApi } from './hooks';
export { TransitionGuideScreen } from './guide-screen';
type Kind = 'OVERVIEW' | 'NOTES' | typeof transitionSectionSchema.enum[keyof typeof transitionSectionSchema.enum];
interface Item { id: string; title: string; content: string }
function rows(kind: Kind, content: TransitionSnapshot['content']): Item[] {
  if (kind === 'OVERVIEW' || kind === 'NOTES') return [{ id: kind, title: kind === 'OVERVIEW' ? strings.transition.overview : strings.transition.notes, content: kind === 'OVERVIEW' ? content.overview : content.notes }];
  if (kind === 'ROUTINES') return content.routines.map((r) => ({ id: r.id, title: r.title, content: [r.description, r.instructions, ...r.steps.map((s) => `- ${s}`)].join('\n\n') }));
  if (kind === 'GUIDELINES') return content.guidelines.map((g) => ({ id: g.id, title: g.title, content: `${strings.guidelines.version(g.version)} · ${g.authorName}\n\n${g.content}` }));
  if (kind === 'CONTACTS') return content.contacts.map((c) => ({ id: c.id, title: c.name, content: [c.organization, c.jobTitle, ...c.phones, c.email ?? '', c.notes].join('\n\n') }));
  return content.tasks.map((t) => ({ id: t.id, title: t.title, content: `${strings.transition.statuses[t.status]}\n\n${strings.transition.responsibility}: ${t.assigneeName}\n\n${strings.transition.deadline}: ${t.dueDate ?? strings.contacts.noInformation}\n\n${t.description}\n\n${t.instructions}` }));
}
function Sections({ selected, change }: { selected: Kind; change: (kind: Kind) => void }) {
  const styles = useStyles();
  return <View style={styles.choices}><Choice label={strings.transition.overview} selected={selected === 'OVERVIEW'} onPress={() => change('OVERVIEW')} />{transitionSectionSchema.options.map((kind) => <Choice key={kind} label={strings.transition.sections[kind]} selected={selected === kind} onPress={() => change(kind)} />)}<Choice label={strings.transition.notes} selected={selected === 'NOTES'} onPress={() => change('NOTES')} /></View>; }
export { TransitionCopiesScreen } from './copies-screen';
export function TransitionCopyScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); const api = useTransitionApi(); const { user } = useSession(); const [kind, setKind] = useState<Kind>('OVERVIEW'); const query = useQuery({ queryKey: ['transition-copy', params.id, user?.id], enabled: valid.success && !!user, retry: false, queryFn: ({ signal }) => api.get(valid.success ? valid.data.id : '', signal) });
  if (!valid.success) return <EmptyState message={strings.transition.notFound} />; if (query.isPending) return <LoadingState />; if (query.isError) return <ErrorState message={errorMessage(query.error)} retry={() => void query.refetch()} />;
  return <Screen><FlashList data={rows(kind, query.data.content)} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<View style={styles.section}><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{query.data.title}</AppText><AppText variant="body">{strings.guidelines.version(query.data.version)} · {query.data.authorName} · {new Date(query.data.createdAt).toLocaleString('pt-BR')}</AppText><AppText variant="body">{strings.transition.preserved}</AppText><Sections selected={kind} change={setKind} /></View>} renderItem={({ item }) => <Card><AppText variant="bodyStrong" style={styles.label}>{item.title}</AppText><MarkdownContent content={item.content} /></Card>} ListEmptyComponent={<EmptyState message={strings.transition.empty} />} /></Screen>;
}
export { TransitionCuratorScreen, TransitionForm } from './curation-screen';
