import { AppText } from '../../components/app-text';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback';
import { routineError, useRoutine } from './hooks';
import { RoutineForm } from './form';
import { RoutineDetail } from './detail-screen';
export { RoutineListScreen } from './list-screen';
export function RoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id });
  const identifier = valid.success ? valid.data.id : undefined;
  return <RoutineDetail key={identifier} id={identifier} />;
}

export function RoutineFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const styles = useStyles();
  const { user } = useSession(); const router = useRouter(); const params = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: params.id }); const id = mode === 'edit' && valid.success ? valid.data.id : undefined;
  const query = useRoutine(user?.role === 'CHEFE' ? id : undefined);
  if (user?.role !== 'CHEFE') return <EmptyState message={strings.routines.forbidden} />;
  if (mode === 'edit' && !valid.success) return <EmptyState message={strings.routines.notFound} />;
  if (mode === 'edit' && query.isPending) return <LoadingState />;
  if (mode === 'edit' && query.isError) return <View><AppText variant="caption" style={styles.error}>{routineError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  if (mode === 'edit' && query.data?.isArchived) return <EmptyState message={strings.routines.archivedError} />;
  return <RoutineForm key={id ?? 'new'} routine={mode === 'edit' ? query.data : undefined}
    onSaved={(routine) => router.replace({ pathname: '/rotina/[id]', params: { id: routine.id } })}
    onCancel={() => { if (id) router.replace({ pathname: '/rotina/[id]', params: { id } }); else router.replace('/rotinas'); }} />;
}
const useStyles = createThemedStyles((theme) => ({ error: { color: theme.colors.danger, padding: 16 } }));
