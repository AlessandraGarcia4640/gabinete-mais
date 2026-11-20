import { AppText } from '../../components/app-text';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Card } from '../../components/card';
import { Screen } from '../../components/screen';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userIdParamsSchema } from '@gabinete-plus/shared';
import { Button } from '../../components/button';
import { TextField } from '../../components/text-field';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { useSession } from '../../providers/session-provider';
import { LoadingState, EmptyState, ErrorState } from '../../components/feedback';
import { Choice } from '../../components/choice';
import { contactError, useContact, useContacts, useContactsApi } from './hooks';
import { ContactForm } from './form';
export function ContactListScreen() {
  const styles = useStyles();
  const router = useRouter(); const { user } = useSession(); const [archived, setArchived] = useState(false); const [keyOnly, setKeyOnly] = useState(false);
  const [input, setInput] = useState({ q: '', organization: '', tag: '' }); const [search, setSearch] = useState(input); const query = useContacts({ ...search, archived, keyOnly });
  const data = useMemo(() => [...new Map((query.data?.pages.flatMap((page) => page.items) ?? []).map((contact) => [contact.id, contact])).values()], [query.data]);
  const header = <View style={styles.section}>{user?.role === 'CHEFE' && <Button label={strings.contacts.create} onPress={() => router.push('/contato/novo')} />}
    <TextField label={strings.contacts.search} value={input.q} onChangeText={(q) => setInput({ ...input, q })} maxLength={100} />
    <TextField label={strings.contacts.filterOrganization} value={input.organization} onChangeText={(organization) => setInput({ ...input, organization })} maxLength={200} />
    <TextField label={strings.contacts.filterTag} value={input.tag} onChangeText={(tag) => setInput({ ...input, tag })} maxLength={40} />
    <Button label={strings.contacts.applyFilters} variant="secondary" onPress={() => setSearch({ q: input.q.trim(), organization: input.organization.trim(), tag: input.tag.trim() })} />
    <Button label={strings.contacts.clearFilters} variant="secondary" onPress={() => { const cleared = { q: '', organization: '', tag: '' }; setInput(cleared); setSearch(cleared); setArchived(false); setKeyOnly(false); }} />
    <View style={styles.choices}><Choice label={strings.contacts.active} selected={!archived} onPress={() => setArchived(false)} /><Choice label={strings.contacts.archived} selected={archived} onPress={() => setArchived(true)} /></View>
    <View style={styles.choices}><Choice label={strings.contacts.all} selected={!keyOnly} onPress={() => setKeyOnly(false)} /><Choice label={strings.contacts.keyOnly} selected={keyOnly} onPress={() => setKeyOnly(true)} /></View></View>;
  return <Screen>{query.isPending ? <View>{header}<LoadingState /></View> : query.isError && !query.data ? <View>{header}<ErrorState retry={() => void query.refetch()} /></View> :
    <FlashList data={data} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={header} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}
      renderItem={({ item }) => <Card label={item.name} onPress={() => router.push({ pathname: '/contato/[id]', params: { id: item.id } })}>
        <AppText variant="bodyStrong" style={styles.label}>{item.name}</AppText><AppText variant="body" style={styles.text}>{item.organization}</AppText>{!!item.jobTitle && <AppText variant="body" style={styles.text}>{item.jobTitle}</AppText>}{item.isKeyContact && <AppText variant="body">{strings.contacts.keyContact}</AppText>}{!!item.tags.length && <AppText variant="body" style={styles.text}>{item.tags.join(' · ')}</AppText>}</Card>}
      ListEmptyComponent={query.isError ? null : <EmptyState message={strings.contacts.empty} />}
      ListFooterComponent={<View style={styles.section}>{query.isError && <ErrorState updating retry={() => { if (query.isFetchNextPageError) void query.fetchNextPage(); else void query.refetch(); }} />}
        {query.hasNextPage && <Button label={strings.feedback.loadMore} loading={query.isFetchingNextPage} disabled={query.isRefetching} onPress={() => void query.fetchNextPage()} />}</View>} />}</Screen>;
}
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
