import type { ReactElement } from 'react';
import { Screen } from '../../components/screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { useSession } from '../../providers/session-provider';
import { strings } from '../../lib/strings';
import { Button } from '../../components/button';
import { AppBar } from '../../components/app-bar';
import { routineError, useRoutine } from '../routines/hooks';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { checklistError, useTemplate } from './hooks';
import { ChecklistForm } from './form';
export { ChecklistListScreen } from './list-screen';
export { ChecklistDetailScreen } from './detail-screen';
export { ChecklistRunScreen } from './run-screen';
export { ChecklistHistoryScreen } from './history-screen';
function identifier(value: string | string[] | undefined): string | undefined { const valid = userIdParamsSchema.safeParse({ id: value }); return valid.success ? valid.data.id : undefined; }
export function ChecklistFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const copy = strings.checklists;
  const params = useLocalSearchParams();
  const id = mode === 'edit' ? identifier(params.id) : undefined;
  const { user } = useSession();
  const isChief = user?.role === 'CHEFE';
  const query = useTemplate(isChief ? id : undefined);
  const routineId = mode === 'create' ? identifier(params.routineId) : query.data?.routineId;
  const routine = useRoutine(isChief ? routineId : undefined);
  const router = useRouter();
  const returnToModels = () => router.replace('/checklists');
  const cancel = () => {
    if (id) router.replace({ pathname: '/checklist/[id]', params: { id } });
    else if (routineId) router.replace({ pathname: '/rotina/[id]', params: { id: routineId } });
    else returnToModels();
  };
  const stateScreen = (state: ReactElement) => (
    <Screen>
      <AppBar title={mode === 'create' ? copy.create : copy.edit} onBack={isChief ? cancel : returnToModels} />
      {state}
    </Screen>
  );
  if (!isChief) return stateScreen(
    <EmptyState icon="lock" message={copy.forbidden}
      actions={<Button label={copy.returnToModels} variant="secondary" onPress={returnToModels} />} />,
  );
  if (mode === 'edit' ? !id : !routineId) return stateScreen(<EmptyState message={copy.notFound} />);
  if (query.isError && !query.data) return stateScreen(
    <ErrorState message={checklistError(query.error)} retry={() => void query.refetch()} />,
  );
  if (routine.isError && !routine.data) return stateScreen(
    <ErrorState message={routineError(routine.error)} retry={() => void routine.refetch()} />,
  );
  if ((mode === 'edit' && query.isPending) || routine.isPending) return stateScreen(<LoadingState />);
  if (query.data?.isArchived || routine.data?.isArchived) return stateScreen(<EmptyState message={copy.archivedError} />);
  if (!routine.data) return stateScreen(<EmptyState message={copy.notFound} />);
  return (
    <ChecklistForm key={id ?? routineId} guardNavigation routine={routine.data} template={query.data} onCancel={cancel}
      onSaved={(saved) => router.replace({ pathname: '/checklist/[id]', params: { id: saved.id } })} />
  );
}
