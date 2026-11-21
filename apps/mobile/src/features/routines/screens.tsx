import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { AppBar, Button, EmptyState, ErrorState, LoadingState, Screen } from '../../components';
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
  const { user } = useSession();
  const router = useRouter();
  const params = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: params.id });
  const id = mode === 'edit' && valid.success ? valid.data.id : undefined;
  const query = useRoutine(user?.role === 'CHEFE' ? id : undefined);
  const copy = strings.routines;
  const returnToList = () => router.replace('/rotinas');
  const cancel = () => { if (id) router.replace({ pathname: '/rotina/[id]', params: { id } }); else returnToList(); };
  const failure = user?.role !== 'CHEFE' ? (
    <EmptyState icon="lock" message={copy.forbiddenTitle} description={copy.forbidden}
      actions={<Button label={copy.backToList} variant="secondary" onPress={returnToList} />} />
  ) : mode === 'edit' && !id ? <EmptyState message={copy.notFound} />
    : mode === 'edit' && query.isPending ? <LoadingState />
      : mode === 'edit' && query.isError && !query.data ? <ErrorState message={routineError(query.error)} retry={() => void query.refetch()} />
        : mode === 'edit' && query.data?.isArchived ? <EmptyState message={copy.archivedError} /> : null;
  if (failure) {
    return (
      <Screen>
        <AppBar title={mode === 'create' ? copy.create : copy.edit} onBack={user?.role === 'CHEFE' ? cancel : returnToList} />
        {failure}
      </Screen>
    );
  }
  return (
    <RoutineForm key={id ?? 'new'} guardNavigation routine={mode === 'edit' ? query.data : undefined} onCancel={cancel}
      onSaved={(routine) => router.replace({ pathname: '/rotina/[id]', params: { id: routine.id } })} />
  );
}
