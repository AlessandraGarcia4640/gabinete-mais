import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { ConnectionGate, useConnection } from './connection-gate';
import { Button } from '../../components';
import { strings } from '../../lib/strings';
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
jest.mock('expo-secure-store', () => { const values = new Map<string, string>(); return { getItemAsync: jest.fn((key: string) => Promise.resolve(values.get(key) ?? null)), setItemAsync: jest.fn((key: string, value: string) => { values.set(key, value); return Promise.resolve(); }), deleteItemAsync: jest.fn((key: string) => { values.delete(key); return Promise.resolve(); }), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' }; });
let previous: string | undefined; let client: QueryClient;
beforeEach(async () => { previous = process.env.EXPO_PUBLIC_API_URL; delete process.env.EXPO_PUBLIC_API_URL; client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); await SecureStore.deleteItemAsync('gabinete.connection.v1'); await SecureStore.deleteItemAsync('gabinete-plus.session.v1'); jest.clearAllMocks(); });
afterEach(() => { cleanup(); client.clear(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
function Connected() { const connection = useConnection(); return connection ? <><Text>{connection.url}</Text><Button label={strings.connection.change} onPress={() => void connection.reset()} /></> : null; }
function show() { render(<QueryClientProvider client={client}><ConnectionGate><Connected /></ConnectionGate></QueryClientProvider>); }
it('primeiro acesso valida e salva endereço normalizado antes de liberar login', async () => { show(); await screen.findByLabelText(strings.connection.address); fireEvent.changeText(screen.getByLabelText(strings.connection.address), 'https://user:password@example.invalid'); fireEvent.press(screen.getByRole('button', { name: strings.connection.connect })); await screen.findByText(strings.connection.invalid); expect(SecureStore.setItemAsync).not.toHaveBeenCalled(); fireEvent.changeText(screen.getByLabelText(strings.connection.address), ' https://example.invalid/api/ '); fireEvent.press(screen.getByRole('button', { name: strings.connection.connect })); await screen.findByText('https://example.invalid/api'); expect(SecureStore.setItemAsync).toHaveBeenCalledWith('gabinete.connection.v1', 'https://example.invalid/api', { keychainAccessible: 'device-only' }); expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('gabinete-plus.session.v1'); });
it('reabre o endereço salvo e troca removendo sessão e cache anteriores', async () => { await SecureStore.setItemAsync('gabinete.connection.v1', 'http://192.168.1.10:3333'); await SecureStore.setItemAsync('gabinete-plus.session.v1', 'sessão fictícia'); client.setQueryData(['private'], 'dados fictícios'); show(); await screen.findByText('http://192.168.1.10:3333'); fireEvent.press(screen.getByRole('button', { name: strings.connection.change })); await screen.findByLabelText(strings.connection.address); expect(await SecureStore.getItemAsync('gabinete-plus.session.v1')).toBeNull(); expect(client.getQueryData(['private'])).toBeUndefined(); });
it('endereço configurado no build libera o fluxo existente sem carregar outro destino', async () => { process.env.EXPO_PUBLIC_API_URL = 'https://configured.example.invalid'; show(); expect(screen.getByText('https://configured.example.invalid')).toBeTruthy(); await act(async () => { await Promise.resolve(); }); expect(SecureStore.getItemAsync).not.toHaveBeenCalled(); });
it('falha de armazenamento mantém configuração aberta sem liberar destino', async () => { show(); await screen.findByLabelText(strings.connection.address); jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('storage')); fireEvent.changeText(screen.getByLabelText(strings.connection.address), 'https://example.invalid'); fireEvent.press(screen.getByRole('button', { name: strings.connection.connect })); await waitFor(() => expect(screen.getByText(strings.connection.storageError)).toBeTruthy()); expect(screen.queryByRole('button', { name: strings.connection.change })).toBeNull(); });

it('anuncia carregamento e oferece ajuda de formato quando o endereço não está salvo', async () => {
  let finish: (url: string | null) => void = () => undefined;
  jest.mocked(SecureStore.getItemAsync).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  show();
  expect(screen.getByText(strings.connection.loading)).toBeTruthy();
  expect(screen.queryByLabelText(strings.connection.address)).toBeNull();
  await act(async () => { finish(null); });
  expect(screen.getByRole('header', { name: strings.connection.title })).toBeTruthy();
  expect(screen.getByLabelText(strings.connection.address)).toHaveProp('keyboardType', 'url');
  expect(screen.getByText(strings.connection.formatHelp)).toBeTruthy();
});

it('envia pelo teclado e bloqueia a entrada enquanto o endereço é gravado', async () => {
  let finish: () => void = () => undefined;
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  show();
  const field = await screen.findByLabelText(strings.connection.address);
  fireEvent.changeText(field, 'https://gabinete.example.invalid');
  fireEvent(field, 'submitEditing');
  const saving = await screen.findByRole('button', { name: strings.connection.saving });
  expect(saving).toBeBusy();
  expect(saving).toBeDisabled();
  expect(screen.getByLabelText(strings.connection.address)).toBeDisabled();
  await act(async () => { finish(); });
  await screen.findByText('https://gabinete.example.invalid');
});

it('apresenta falha na leitura como alerta e mantém a configuração disponível', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('storage'));
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent(strings.connection.storageError);
  expect(screen.getByRole('button', { name: strings.connection.connect })).toBeEnabled();
});
