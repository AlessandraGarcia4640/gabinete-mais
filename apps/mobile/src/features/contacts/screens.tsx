import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { AppBar, Screen, LoadingState, EmptyState, ErrorState } from '../../components';
import { strings } from '../../lib/strings';
import { useSession } from '../../providers/session-provider';
import { contactError, useContact } from './hooks';
import { ContactForm } from './form';
export { ContactListScreen } from './list-screen';
export { ContactDetailScreen } from './detail-screen';
export function ContactFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const params = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: params.id });
  const id = mode === 'edit' && valid.success ? valid.data.id : undefined;
  const { user } = useSession();
  const query = useContact(user?.role === 'CHEFE' ? id : undefined);
  const router = useRouter();
  const copy = strings.contacts;
  function cancel() {
    if (id) router.replace({ pathname: '/contato/[id]', params: { id } });
    else router.replace('/contatos');
  }
  let state = null;
  if (user?.role !== 'CHEFE') state = <EmptyState message={copy.forbidden} />;
  else if (mode === 'edit' && !id) state = <EmptyState message={copy.notFound} />;
  else if (mode === 'edit' && query.isPending) state = <LoadingState />;
  else if (mode === 'edit' && query.isError) state = <ErrorState message={contactError(query.error)} retry={() => void query.refetch()} />;
  else if (mode === 'edit' && query.data?.isArchived) state = <EmptyState message={copy.archivedError} />;
  if (state) return <Screen><AppBar title={mode === 'edit' ? copy.edit : copy.create} onBack={cancel} />{state}</Screen>;
  return <ContactForm key={id ?? 'new'} contact={mode === 'edit' ? query.data : undefined} guardNavigation onCancel={cancel}
    onSaved={(saved) => router.replace({ pathname: '/contato/[id]', params: { id: saved.id } })} />;
}
