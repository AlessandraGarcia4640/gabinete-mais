import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { connectionUrlSchema, connectionFormSchema } from '@gabinete-plus/shared';
import { AppText, AuthScreen, Banner, Button, TextField } from '../../components';
import { strings } from '../../lib/strings';
import { spacing } from '../../lib/theme';
import { BrandMark } from '../../navigation/brand-mark';
import { useTheme } from '../../providers/theme-provider';
import { secureSessionStorage } from './storage';
import { readConnectionUrl, saveConnectionUrl, clearConnectionUrl } from './connection-storage';
interface Connection { url: string; reset: () => Promise<void> }
const ConnectionContext = createContext<Connection | null>(null);
export const useConnection = () => useContext(ConnectionContext);
export function ConnectionGate({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const configured = connectionUrlSchema.safeParse(process.env.EXPO_PUBLIC_API_URL); const client = useQueryClient();
  const [url, setUrl] = useState<string | null>(configured.success ? configured.data : null); const [loading, setLoading] = useState(!configured.success); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const form = useForm<{ url: string }>({ resolver: zodResolver(connectionFormSchema), defaultValues: { url: '' } });
  useEffect(() => { let active = true; if (!configured.success) void readConnectionUrl().then((saved) => { if (active) setUrl(saved); }).catch(() => { if (active) setMessage(strings.connection.storageError); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [configured.success]);
  async function reset() { await secureSessionStorage.clear(); await clearConnectionUrl(); client.clear(); setUrl(null); form.reset({ url: '' }); }
  async function save(input: { url: string }) { setBusy(true); setMessage(null); try { const valid = connectionUrlSchema.parse(input.url); await secureSessionStorage.clear(); await saveConnectionUrl(valid); client.clear(); setUrl(valid); } catch { setMessage(strings.connection.storageError); } finally { setBusy(false); } }
  if (loading) {
    return (
      <AuthScreen contentStyle={styles.page}>
        <BrandMark large />
        <View accessibilityState={{ busy: true }} style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <AppText variant="body" color="inkMuted" accessibilityLiveRegion="polite">{strings.connection.loading}</AppText>
        </View>
      </AuthScreen>
    );
  }
  if (url) return <ConnectionContext.Provider value={{ url, reset }}>{children}</ConnectionContext.Provider>;
  const submit = () => { if (!busy) void form.handleSubmit(save)(); };
  return (
    <AuthScreen contentStyle={styles.page}>
      <BrandMark large />
      <View style={styles.heading}>
        <AppText variant="titleLg" accessibilityRole="header">{strings.connection.title}</AppText>
        <AppText variant="body" color="inkMuted">{strings.connection.help}</AppText>
      </View>
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <TextField
              label={strings.connection.address}
              help={strings.connection.formatHelp}
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={submit}
              editable={!busy}
              errorText={fieldState.error ? strings.connection.invalid : undefined}
            />
          )}
        />
        {!!message && <Banner tone="danger" message={message} />}
        <Button label={busy ? strings.connection.saving : strings.connection.connect} loading={busy} onPress={submit} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: spacing.space16, paddingBottom: spacing.space8, gap: spacing.space8 },
  heading: { gap: spacing.space2 },
  form: { gap: spacing.space5 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.space2 },
});
