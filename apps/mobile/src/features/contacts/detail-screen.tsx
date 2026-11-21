import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { canOpenURL, openURL } from 'expo-linking';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userIdParamsSchema, type Contact } from '@gabinete-plus/shared';
import {
  AppBar, AppText, Avatar, Banner, Button, Card, Dialog, EmptyState, ErrorState, IconButton, ListGroup, ListRow,
  LoadingState, Screen, Section, Tag, type IconName,
} from '../../components';
import { strings } from '../../lib/strings';
import { size, spacing } from '../../lib/theme';
import { useSession } from '../../providers/session-provider';
import { contactError, useContact, useContactsApi } from './hooks';

const copy = strings.contacts;
type Channel = { title: string; description: string; icon: IconName; url?: string; action?: string };

function phoneUrl(phone: string) {
  const [number = '', extension] = phone.split(/\s*(?:ramal|x)\s*/i);
  const prefix = number.startsWith('+') ? '+' : '';
  const digits = number.replace(/\D/g, '');
  return `tel:${prefix}${digits}${extension ? `;ext=${extension.trim()}` : ''}`;
}

function ContactChannels({ phones, email }: Pick<Contact, 'phones' | 'email'>) {
  const channels = useMemo(() => {
    const phoneChannels: Channel[] = phones.map((title, index) => ({
      title, description: copy.phone(index), icon: 'phone', url: phoneUrl(title), action: copy.callPhone(title),
    }));
    const emailChannel: Channel = email ? {
      title: email, description: copy.email, icon: 'mail', url: `mailto:${encodeURIComponent(email).replace('%40', '@')}`,
      action: copy.writeEmail(email),
    } : { title: copy.noInformation, description: copy.email, icon: 'mail' };
    return {
      phone: phoneChannels[0]?.url,
      email: emailChannel.url,
      entries: [
        ...(phoneChannels.length ? phoneChannels : [{ title: copy.noInformation, description: copy.phones, icon: 'phone' } satisfies Channel]),
        emailChannel,
      ],
    };
  }, [email, phones]);
  const [available, setAvailable] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    const links = [...new Set(channels.entries.flatMap(({ url }) => url ? [url] : []))];
    void Promise.all(links.map(async (url) => ({ url, supported: await canOpenURL(url).catch(() => false) })))
      .then((results) => { if (current) setAvailable(results.filter(({ supported }) => supported).map(({ url }) => url)); });
    return () => { current = false; };
  }, [channels]);

  const open = (url?: string) => url && available.includes(url) ? () => {
    setFailed(false);
    void openURL(url).catch(() => setFailed(true));
  } : undefined;
  const call = open(channels.phone);
  const mail = open(channels.email);

  return (
    <>
      {(call || mail) && (
        <View style={styles.quick}>
          {call && <Button label={copy.call} icon="phone" variant="secondary" style={styles.quickButton} onPress={call} />}
          {mail && <Button label={copy.email} icon="mail" variant="secondary" style={styles.quickButton} onPress={mail} />}
        </View>
      )}
      {failed && <Banner tone="danger" message={copy.linkUnavailable} />}
      <ListGroup>
        {channels.entries.map(({ title, description, icon, url, action }) => (
          <ListRow key={description} title={title} description={description} icon={icon} selectable
            accessibilityLabel={action} onPress={open(url)} />
        ))}
      </ListGroup>
    </>
  );
}

export function ContactDetailScreen() {
  const { id: param } = useLocalSearchParams();
  const valid = userIdParamsSchema.safeParse({ id: param });
  const id = valid.success ? valid.data.id : undefined;
  return <ContactDetail key={id} id={id} />;
}

function ContactDetail({ id }: { id?: string }) {
  const query = useContact(id);
  const { user } = useSession();
  const router = useRouter();
  const api = useContactsApi();
  const client = useQueryClient();
  const archiveRef = useRef<View>(null);
  const [confirm, setConfirm] = useState(false);
  const archive = useMutation({
    retry: false,
    mutationFn: () => api.archive(id ?? ''),
    onSuccess: async () => {
      setConfirm(false);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['contact', id] }),
        client.invalidateQueries({ queryKey: ['contacts'] }),
      ]);
    },
  });
  const contact = query.data;
  const canManage = user?.role === 'CHEFE' && !!contact && !contact.isArchived;
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/contatos'); };

  return (
    <Screen>
      <AppBar title={copy.details} onBack={back} action={canManage && (
        <View style={styles.actions}>
          <IconButton label={copy.edit} icon="edit-2" disabled={archive.isPending}
            onPress={() => router.push({ pathname: '/contato/[id]/editar', params: { id: contact.id } })} />
          <IconButton ref={archiveRef} label={copy.archive} icon="archive" disabled={archive.isPending}
            onPress={() => { archive.reset(); setConfirm(true); }} />
        </View>
      )} />
      {!id ? <EmptyState message={copy.notFound} /> : query.isPending ? <LoadingState /> : query.isError ? (
        <ErrorState message={contactError(query.error)} retry={() => void query.refetch()} />
      ) : contact && (
        <ScrollView contentContainerStyle={styles.content}>
          {contact.isArchived && <Banner tone="neutral" message={copy.archivedLabel} />}
          <View style={styles.identity}>
            <Avatar name={contact.name} size="lg" />
            <View style={styles.identityCopy}>
              <AppText variant="titleLg" accessibilityRole="header" selectable style={styles.center}>{contact.name}</AppText>
              <AppText variant="body" color="inkMuted" selectable style={styles.center}>
                {contact.jobTitle ? strings.routines.metadata(contact.jobTitle, contact.organization) : contact.organization}
              </AppText>
            </View>
            {contact.isKeyContact && <View><Tag label={copy.keyContact} icon="star" /></View>}
          </View>
          <ContactChannels phones={contact.phones} email={contact.email} />
          <Section title={copy.tags}>
            {contact.tags.length ? <View style={styles.tags}>
              {contact.tags.map((tag) => <Tag key={tag} label={tag} icon="tag" tone="neutral" />)}
            </View> : <AppText variant="body" color="inkMuted">{copy.noInformation}</AppText>}
          </Section>
          <Section title={copy.notes}>
            <Card><AppText variant="body" selectable>{contact.notes || copy.noInformation}</AppText></Card>
          </Section>
        </ScrollView>
      )}
      <Dialog title={copy.archiveTitle} visible={confirm} message={copy.archiveHelp} error={archive.isError ? contactError(archive.error) : undefined}
        confirmLabel={copy.confirmArchive} dismissLabel={strings.routines.cancel} busy={archive.isPending} returnFocusRef={archiveRef}
        onDismiss={() => setConfirm(false)} onConfirm={() => { if (canManage) archive.mutate(); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.space1 },
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space6 },
  identity: { alignItems: 'center', gap: spacing.space3 },
  identityCopy: { gap: spacing.space1 },
  center: { textAlign: 'center' },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space3 },
  quickButton: { flex: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space2 },
});
