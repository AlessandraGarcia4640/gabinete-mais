import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { useMutation } from '@tanstack/react-query';
import { AppText, Avatar, Button, Card, Dialog, LargeHeader, ListGroup, ListRow, Screen, Tag } from '../../components';
import { strings } from '../../lib/strings';
import { size, spacing } from '../../lib/theme';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { useConnection } from './connection-gate';

const copy = strings.session;

export function SessionScreen() {
  const { user } = useSession();
  const manager = useSessionManager();
  const connection = useConnection();
  const [confirm, setConfirm] = useState(false);
  const addressRef = useRef<View>(null);
  const logout = useMutation({ mutationFn: () => manager.logout(), retry: false });
  const change = useMutation({
    retry: false,
    mutationFn: async () => {
      if (!connection) return;
      await manager.logout();
      await connection.reset();
    },
  });
  if (!user) return null;
  const role = copy.roles[user.role];
  const appVersion = Constants.expoConfig?.version;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} accessibilityElementsHidden={confirm}
        importantForAccessibility={confirm ? 'no-hide-descendants' : 'auto'}>
        <LargeHeader title={strings.nav.profile} />
        <Card style={styles.account}>
          <Avatar name={user.name} size="lg" />
          <View style={styles.identity}>
            <AppText variant="title" accessibilityRole="header">{user.name}</AppText>
            <AppText variant="label" color="inkMuted" selectable>{user.email}</AppText>
            <Tag label={role} icon="briefcase" />
          </View>
        </Card>
        <ListGroup label={copy.access}>
          <ListRow icon="lock" title={copy.profile} description={strings.routines.metadata(role, copy.roleDetails[user.role])} />
          <ListRow ref={addressRef} icon="globe" title={strings.connection.address} description={connection?.url ?? manager.apiUrl}
            onPress={connection ? () => { change.reset(); setConfirm(true); } : undefined} />
          <ListRow icon="eye" title={copy.appearance} description={copy.appearanceHelp} />
        </ListGroup>
        <Button label={logout.isPending ? copy.leaving : copy.logout} icon="log-out" variant="secondary"
          loading={logout.isPending} disabled={change.isPending} onPress={() => logout.mutate()} />
        {!!appVersion && <AppText variant="caption" color="inkMuted" style={styles.version}>{copy.version(appVersion)}</AppText>}
      </ScrollView>
      <Dialog title={strings.connection.change} visible={confirm} message={copy.changeAddressHelp} intent="primary"
        error={change.isError ? strings.connection.storageError : undefined} confirmLabel={strings.connection.change}
        dismissLabel={strings.routines.cancel} busy={change.isPending} returnFocusRef={addressRef}
        onDismiss={() => setConfirm(false)} onConfirm={() => change.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: size.contentMax, alignSelf: 'center', padding: spacing.space4, gap: spacing.space6 },
  account: { flexDirection: 'row', alignItems: 'center', gap: spacing.space4 },
  identity: { flex: 1, minWidth: 0, gap: spacing.space1 },
  version: { textAlign: 'center' },
});
