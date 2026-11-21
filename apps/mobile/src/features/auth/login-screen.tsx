import { useConnection } from './connection-gate';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema, type LoginRequest } from '@gabinete-plus/shared';
import { AppText, AuthScreen, Banner, Button, IconButton, TextField, Toast } from '../../components';
import { strings } from '../../lib/strings';
import { dimensions, spacing } from '../../lib/theme';
import { BrandMark } from '../../navigation/brand-mark';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { authMessage } from './errors';
export function LoginScreen() {
  const manager = useSessionManager(); const session = useSession(); const connection = useConnection();
  const [visible, setVisible] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const form = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema), defaultValues: { email: '', password: '' } });
  const login = useMutation({ mutationFn: (input: LoginRequest) => manager.login(input), retry: false, gcTime: 0 });
  async function submit(input: LoginRequest): Promise<void> {
    setMessage(null);
    try { await login.mutateAsync(input); }
    catch (error) { setMessage(error instanceof Error ? authMessage(error) : strings.auth.unexpected); }
    finally { form.setValue('password', ''); login.reset(); }
  }
  const notice = message ?? (session.errorCode ? strings.auth[session.errorCode] : null);
  const offlineLogout = !message && session.errorCode === 'logoutOffline';
  const send = () => { if (!login.isPending) void form.handleSubmit(submit)(); };
  return (
    <AuthScreen contentStyle={styles.page}>
      <BrandMark large />
      <View style={styles.header}>
        <AppText variant="display" accessibilityRole="header">{strings.auth.title}</AppText>
        <AppText variant="body" color="inkMuted">{strings.auth.subtitle}</AppText>
      </View>
      <View style={styles.form}>
        {!!notice && !offlineLogout && <Banner tone="danger" message={notice} />}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label={strings.auth.email} value={field.value}
              onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="email-address"
              autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username"
              editable={!login.isPending} placeholder={strings.auth.emailPlaceholder}
              errorText={fieldState.error ? strings.auth.invalidEmail : undefined}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label={strings.auth.password} value={field.value}
              onChangeText={field.onChange} onBlur={field.onBlur} secureTextEntry={!visible}
              autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password"
              editable={!login.isPending} returnKeyType="go" onSubmitEditing={send}
              errorText={fieldState.error ? strings.auth.invalidPassword : undefined}
              accessory={(
                <IconButton
                  label={visible ? strings.auth.hidePassword : strings.auth.showPassword}
                  icon={visible ? 'eye-off' : 'eye'}
                  disabled={login.isPending}
                  onPress={() => setVisible(!visible)}
                />
              )}
            />
          )}
        />
        <Button label={login.isPending ? strings.auth.submitting : strings.auth.submit} loading={login.isPending} onPress={send} />
      </View>
      <View style={styles.footer}>
        <AppText variant="caption" color="inkMuted" style={styles.footnote}>{strings.auth.invitation}</AppText>
        {Platform.OS === 'web' && <AppText variant="caption" color="inkMuted" style={styles.footnote}>{strings.auth.webSession}</AppText>}
        {connection && (
          <Button
            label={strings.connection.change} variant="ghost" size="sm" disabled={login.isPending}
            onPress={() => { void connection.reset().catch(() => setMessage(strings.connection.storageError)); }}
          />
        )}
      </View>
      {!!notice && offlineLogout && <Toast message={notice} />}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  page: { maxWidth: dimensions.loginMax, paddingTop: spacing.space16, paddingBottom: spacing.space8, gap: spacing.space8 },
  header: { gap: spacing.space2 },
  form: { gap: spacing.space5 },
  footer: { alignItems: 'center', gap: spacing.space3 },
  footnote: { textAlign: 'center' },
});
