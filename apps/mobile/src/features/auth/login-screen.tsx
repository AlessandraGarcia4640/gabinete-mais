import { AppText } from '../../components/app-text';
import { useConnection } from './connection-gate';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginRequestSchema, type LoginRequest } from '@gabinete-plus/shared';
import { AuthScreen } from '../../components/auth-screen';
import { Card } from '../../components/card';
import { Button } from '../../components/button';
import { TextField } from '../../components/text-field';
import { strings } from '../../lib/strings';
import { createThemedStyles } from '../../providers/theme-provider';
import { useSession, useSessionManager } from '../../providers/session-provider';
import { authMessage } from './errors';
export function LoginScreen() {
  const styles = useStyles();
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
  return <AuthScreen><View style={styles.header}>
    <AppText variant="titleLg" style={styles.brand}>{strings.brand}</AppText><AppText variant="titleLg" accessibilityRole="header" style={styles.title}>{strings.auth.title}</AppText>
    <AppText variant="caption" style={styles.description}>{strings.auth.subtitle}</AppText>
  </View><Card style={styles.form}>
    <Controller control={form.control} name="email" render={({ field, fieldState }) => <TextField label={strings.auth.email} value={field.value}
      onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
      autoComplete="email" textContentType="username" editable={!login.isPending} placeholder={strings.auth.emailPlaceholder}
      errorText={fieldState.error ? strings.auth.invalidEmail : undefined} />} />
    <Controller control={form.control} name="password" render={({ field, fieldState }) => <TextField label={strings.auth.password} value={field.value}
      onChangeText={field.onChange} onBlur={field.onBlur} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false}
      autoComplete="current-password" textContentType="password" editable={!login.isPending} returnKeyType="go"
      onSubmitEditing={() => { if (!login.isPending) void form.handleSubmit(submit)(); }}
      errorText={fieldState.error ? strings.auth.invalidPassword : undefined} />} />
    <Button label={visible ? strings.auth.hidePassword : strings.auth.showPassword} variant="secondary" disabled={login.isPending} onPress={() => setVisible(!visible)} />
    {!!notice && <AppText variant="caption" accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{notice}</AppText>}
    <Button label={login.isPending ? strings.auth.submitting : strings.auth.submit} loading={login.isPending} onPress={() => void form.handleSubmit(submit)()} />
  </Card>{connection && <Button label={strings.connection.change} variant="secondary" disabled={login.isPending} onPress={() => { void connection.reset().catch(() => setMessage(strings.connection.storageError)); }} />}<AppText variant="caption" style={styles.footnote}>{strings.auth.invitation}</AppText>
    {Platform.OS === 'web' && <AppText variant="caption" style={styles.footnote}>{strings.auth.webSession}</AppText>}
  </AuthScreen>;
}
const useStyles = createThemedStyles((theme) => ({ header: { gap: 14 }, brand: { color: theme.colors.brandText },
  title: { color: theme.colors.ink }, description: { color: theme.colors.inkMuted },
  form: { padding: 22, gap: 20, marginBottom: 0 },
  error: { backgroundColor: theme.colors.dangerSoft, color: theme.colors.danger, padding: 14, borderRadius: 10 },
  footnote: { color: theme.colors.inkMuted, textAlign: 'center' } }));
