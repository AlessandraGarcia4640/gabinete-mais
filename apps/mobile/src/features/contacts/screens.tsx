import { AppText } from '../../components/app-text';
import { useState } from 'react';
import { View } from 'react-native';
import { Card } from '../../components/card';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { Button } from '../../components/button';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { useSession } from '../../providers/session-provider';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { contactError, useContact, useContactsApi } from './hooks';
import { ContactForm } from './form';
export { ContactListScreen } from './list-screen';
export function ContactDetailScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams(); const valid = userIdParamsSchema.safeParse({ id: params.id }); const id = valid.success ? valid.data.id : undefined;
  const query = useContact(id); const { user } = useSession(); const api = useContactsApi(); const router = useRouter(); const client = useQueryClient(); const [confirm, setConfirm] = useState(false);
  const archive = useMutation({ retry: false, mutationFn: () => api.archive(id ?? ''), onSuccess: async () => {
    setConfirm(false); await Promise.all([client.invalidateQueries({ queryKey: ['contact', id] }), client.invalidateQueries({ queryKey: ['contacts'] })]);
  } });
  if (!id) return <EmptyState message={strings.contacts.notFound} />;
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <View><AppText variant="caption" style={styles.error}>{contactError(query.error)}</AppText><ErrorState retry={() => void query.refetch()} /></View>;
  const contact = query.data;
  return <Screen><FlashList data={contact.phones.map((text, index) => ({ text, index }))} keyExtractor={(item) => String(item.index)} contentContainerStyle={styles.content}
    ListHeaderComponent={<View style={styles.section}><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{contact.name}</AppText>{contact.isArchived && <AppText variant="body">{strings.contacts.archivedLabel}</AppText>}
      <AppText variant="bodyStrong" style={styles.label}>{strings.contacts.organization}</AppText><AppText variant="body" style={styles.text}>{contact.organization}</AppText><AppText variant="bodyStrong" style={styles.label}>{strings.contacts.jobTitle}</AppText><AppText variant="body" style={styles.text}>{contact.jobTitle || strings.contacts.noInformation}</AppText>
      <AppText variant="bodyStrong" style={styles.label}>{strings.contacts.email}</AppText><AppText variant="body" selectable style={styles.text}>{contact.email ?? strings.contacts.noInformation}</AppText>
      <AppText variant="bodyStrong" style={styles.label}>{strings.contacts.tags}</AppText><AppText variant="body" style={styles.text}>{contact.tags.length ? contact.tags.join(' · ') : strings.contacts.noTags}</AppText>
      <AppText variant="bodyStrong" style={styles.label}>{strings.contacts.notes}</AppText><AppText variant="body" style={styles.text}>{contact.notes || strings.contacts.noInformation}</AppText>
      <AppText variant="body">{strings.contacts.keyContact}: {contact.isKeyContact ? strings.routines.yes : strings.routines.no}</AppText><AppText variant="bodyStrong" style={styles.label}>{strings.contacts.phones}</AppText></View>}
    renderItem={({ item }) => <Card><AppText variant="bodyStrong" style={styles.label}>{strings.contacts.phone(item.index)}</AppText><AppText variant="body" selectable style={styles.text}>{item.text}</AppText></Card>}
    ListEmptyComponent={<AppText variant="body" style={styles.text}>{strings.contacts.noPhones}</AppText>}
    ListFooterComponent={<View style={styles.section}>{archive.isError && <AppText variant="caption" accessibilityRole="alert" style={styles.error}>{contactError(archive.error)}</AppText>}
      {user?.role === 'CHEFE' && !contact.isArchived && <><Button label={strings.contacts.edit} disabled={archive.isPending} onPress={() => router.push({ pathname: '/contato/[id]/editar', params: { id: contact.id } })} />
        {!confirm ? <Button label={strings.contacts.archive} variant="secondary" onPress={() => setConfirm(true)} /> : <><AppText variant="body">{strings.contacts.archiveHelp}</AppText><Button label={strings.contacts.confirmArchive} loading={archive.isPending} onPress={() => archive.mutate()} /><Button label={strings.routines.cancel} variant="secondary" disabled={archive.isPending} onPress={() => setConfirm(false)} /></>}</>}
    </View>} /></Screen>;
}
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
const useStyles = createThemedStyles((theme) => ({ content: { padding: 20 }, section: { gap: 12, paddingVertical: 16 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { color: theme.colors.ink }, label: { color: theme.colors.ink }, text: { color: theme.colors.inkMuted }, error: { color: theme.colors.danger, padding: 16 },
}));
