import { AppText } from '../../components/app-text';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { useSession } from '../../providers/session-provider';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { contactError, useContact } from './hooks';
import { ContactForm } from './form';
export { ContactListScreen } from './list-screen';
export { ContactDetailScreen } from './detail-screen';
export function ContactFormScreen({ mode }: { mode: 'create' | 'edit' }) {
  const styles = useStyles();
  const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); const id = mode === 'edit' && valid.success ? valid.data.id : undefined;
  const { user } = useSession(); const query = useContact(user?.role === 'CHEFE' ? id : undefined); const router = useRouter();
  if (user?.role !== 'CHEFE') return <EmptyState message={strings.contacts.forbidden} />;
  if (mode === 'edit' && !id) return <EmptyState message={strings.contacts.notFound} />;
  if (mode === 'edit' && query.isPending) return <LoadingState />;
  if (mode === 'edit' && query.isError) return <View><AppText variant="caption" style={styles.error}>{contactError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  if (mode === 'edit' && query.data?.isArchived) return <EmptyState message={strings.contacts.archivedError} />;
  return <ContactForm key={id ?? 'new'} contact={mode === 'edit' ? query.data : undefined} onSaved={(saved) => router.replace({ pathname: '/contato/[id]', params: { id: saved.id } })}
    onCancel={() => { if (id) router.replace({ pathname: '/contato/[id]', params: { id } }); else router.replace('/contatos'); }} />;
}
const useStyles = createThemedStyles((theme) => ({ error: { color: theme.colors.danger, padding: 16 } }));
