import { AppText } from '../../components/app-text';
import { ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { guidelineVersionParamsSchema, userIdParamsSchema } from '@gabinete-plus/shared';
import { Button, Card, Screen, EmptyState, ErrorState, LoadingState } from '../../components';
import { MarkdownContent } from '../../components/markdown-content';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { useStyles } from '../tasks/styles';
import { guidelineError, useGuidelineHistory, useGuidelinesApi } from './hooks';
export { GuidelineListScreen } from './list-screen';
export { GuidelineDetailScreen } from './detail-screen';
export { GuidelineForm, GuidelineFormScreen } from './form-screen';
function useId() { const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); return valid.success ? valid.data.id : undefined; }
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
