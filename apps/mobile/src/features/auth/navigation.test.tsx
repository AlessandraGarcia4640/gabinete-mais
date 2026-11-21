import { TransitionGuideScreen, TransitionCuratorScreen, TransitionCopiesScreen, TransitionCopyScreen } from '../transition/screens';
import { GuidelineDetailScreen, GuidelineFormScreen, GuidelineHistoryScreen, GuidelineVersionScreen } from '../guidelines/screens';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { loginResponseSchema, createContactSchema, updateContactSchema } from '@gabinete-plus/shared';
import { taskFixture } from '../dashboard/fixtures.test-helper';
import { contactFixture } from '../contacts/fixtures.test-helper';
import { renderRouter } from 'expo-router/testing-library';
import RootLayout from '../../../app/_layout';
import SessionLayout from '../../../app/(tabs)/_layout';
import WorkLayout from '../../../app/(tabs)/(work)/_layout';
import RoutinesLayout from '../../../app/(tabs)/(routines)/_layout';
import CabinetLayout from '../../../app/(tabs)/(cabinet)/_layout';
import CabinetRoute from '../../../app/(tabs)/(cabinet)/gabinete';
import TasksRoute from '../../../app/(tabs)/(work)/tarefas';
import GuidelinesRoute from '../../../app/(tabs)/(cabinet)/orientacoes';
import { LoginScreen } from './login-screen';
import { SessionScreen } from './session-screen';
import { RoutineListScreen, RoutineDetailScreen, RoutineFormScreen } from '../routines/screens';
import { strings } from '../../lib/strings';
import { DashboardScreen } from '../dashboard/dashboard-screen';
import { TaskDetailScreen, TaskFormScreen, TaskHistoryScreen } from '../tasks/screens';
import { ChecklistListScreen, ChecklistHistoryScreen, ChecklistDetailScreen, ChecklistRunScreen, ChecklistFormScreen } from '../checklists/screens';
import { ContactListScreen, ContactDetailScreen, ContactFormScreen } from '../contacts/screens';
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native'); return { FlashList: FlatList };
});
// Development websocket side effects are outside the navigation test.
jest.mock('expo/src/async-require/messageSocket', () => ({}));
jest.mock('react-native/Libraries/NativeModules/specs/NativeSourceCode', () => ({
  __esModule: true, default: { getConstants: () => ({ scriptURL: 'file://test.bundle' }) },
}));
jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default;
});
jest.mock('expo-secure-store', () => {
  let value: string | null = null;
  return { getItemAsync: jest.fn(() => Promise.resolve(value)),
    setItemAsync: jest.fn((_key: string, next: string) => { value = next; return Promise.resolve(); }),
    deleteItemAsync: jest.fn(() => { value = null; return Promise.resolve(); }), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' };
});
beforeEach(async () => { await SecureStore.deleteItemAsync('test-reset'); });
afterEach(cleanup);
function authResponse(role: 'CHEFE' | 'ASSESSOR') { return loginResponseSchema.parse({ accessToken: 'access-ficticio', refreshToken: 'A'.repeat(43), refreshExpiresAt: '2099-01-01T00:00:00Z', tokenType: 'Bearer', expiresIn: 900, user: { id: 'actor', name: 'Pessoa Fictícia', email: 'pessoa@example.invalid', role, isActive: true } }); }
async function enter() {
  await screen.findByRole('button', { name: strings.auth.submit }); fireEvent.changeText(screen.getByLabelText(strings.auth.email), 'pessoa@example.invalid'); fireEvent.changeText(screen.getByLabelText(strings.auth.password), 'Senha-ficticia-42'); fireEvent.press(screen.getByRole('button', { name: strings.auth.submit })); await screen.findByRole('header', { name: strings.dashboard.greeting('Pessoa') });
}
async function leave() { fireEvent.press(screen.getByRole('button', { name: strings.session.logout })); await screen.findByRole('button', { name: strings.auth.submit }); }
function renderApp(initialUrl = '/') { return renderRouter({ _layout: RootLayout, login: LoginScreen, '(tabs)/_layout': SessionLayout, '(tabs)/index': DashboardScreen,
      '(tabs)/(work)/_layout': WorkLayout, '(tabs)/(routines)/_layout': RoutinesLayout,
      '(tabs)/(cabinet)/_layout': CabinetLayout, '(tabs)/(cabinet)/gabinete': CabinetRoute,
      '(tabs)/(cabinet)/orientacoes': GuidelinesRoute, '(tabs)/(cabinet)/orientacao/nova': () => <GuidelineFormScreen mode="create" />, '(tabs)/(cabinet)/orientacao/[id]': GuidelineDetailScreen, '(tabs)/(cabinet)/orientacao/[id]/editar': () => <GuidelineFormScreen mode="edit" />, '(tabs)/(cabinet)/orientacao/[id]/versoes': GuidelineHistoryScreen, '(tabs)/(cabinet)/orientacao/[id]/versao/[version]': GuidelineVersionScreen, '(tabs)/(cabinet)/transicao': TransitionGuideScreen, '(tabs)/(cabinet)/transicao/preparar': TransitionCuratorScreen, '(tabs)/(cabinet)/transicao/copias': TransitionCopiesScreen, '(tabs)/(cabinet)/transicao/copia/[id]': TransitionCopyScreen, '(tabs)/perfil': SessionScreen, '(tabs)/(work)/tarefas': TasksRoute, '(tabs)/(routines)/rotinas': RoutineListScreen, '(tabs)/(routines)/rotina/[id]': RoutineDetailScreen,
      '(tabs)/(routines)/rotina/nova': () => <RoutineFormScreen mode="create" />, '(tabs)/(routines)/rotina/[id]/editar': () => <RoutineFormScreen mode="edit" />,
      '(tabs)/(routines)/checklists': ChecklistListScreen, '(tabs)/(routines)/execucoes': ChecklistHistoryScreen, '(tabs)/(routines)/checklist/[id]': ChecklistDetailScreen,
      '(tabs)/(routines)/execucao/[id]': ChecklistRunScreen, '(tabs)/(routines)/checklist/nova': () => <ChecklistFormScreen mode="create" />, '(tabs)/(routines)/checklist/[id]/editar': () => <ChecklistFormScreen mode="edit" />,
      '(tabs)/(cabinet)/contatos': ContactListScreen, '(tabs)/(cabinet)/contato/[id]': ContactDetailScreen, '(tabs)/(cabinet)/contato/novo': () => <ContactFormScreen mode="create" />, '(tabs)/(cabinet)/contato/[id]/editar': () => <ContactFormScreen mode="edit" />,
      '(tabs)/(work)/tarefa/[id]': TaskDetailScreen, '(tabs)/(work)/tarefa/nova': () => <TaskFormScreen mode="create" />, '(tabs)/(work)/tarefa/[id]/editar': () => <TaskFormScreen mode="edit" />, '(tabs)/(work)/tarefa/[id]/historico': TaskHistoryScreen }, { initialUrl }); }
it('rota privada abre login, sucesso navega para o gabinete e sair impede voltar à área privada', async () => {
  const previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid';
  const fetcher = jest.spyOn(globalThis, 'fetch').mockImplementation((url) => {
    if (String(url).endsWith('/auth/login')) return Promise.resolve(new Response(JSON.stringify({
      accessToken: 'access-ficticio', refreshToken: 'A'.repeat(43), refreshExpiresAt: '2099-01-01T00:00:00Z', tokenType: 'Bearer', expiresIn: 900,
      user: { id: 'actor', name: 'Pessoa Fictícia', email: 'pessoa@example.invalid', role: 'ASSESSOR', isActive: true },
    }), { status: 200 }));
    if (String(url).endsWith('/auth/logout')) return Promise.resolve(new Response(null, { status: 204 }));
    if (String(url).includes('/tasks?') || String(url).includes('/routines?') || String(url).includes('/checklists/')) return Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null })));
    return Promise.reject(new Error('Endpoint não previsto.'));
  });
  try {
    renderApp();
    await screen.findByRole('button', { name: strings.auth.submit }); expect(screen.queryByRole('header', { name: strings.dashboard.greeting('Pessoa') })).toBeNull();
    fireEvent.changeText(screen.getByLabelText(strings.auth.email), 'pessoa@example.invalid');
    fireEvent.changeText(screen.getByLabelText(strings.auth.password), 'Senha-ficticia-34');
    fireEvent.press(screen.getByRole('button', { name: strings.auth.submit }));
    await screen.findByRole('header', { name: strings.dashboard.greeting('Pessoa') }); expect(screen.queryByRole('button', { name: strings.auth.submit })).toBeNull();
    await screen.findByText(strings.dashboard.emptyTasks);
    fireEvent.press(screen.getByRole('tab', { name: strings.nav.routines }));
    fireEvent.press(await screen.findByRole('tab', { name: strings.nav.checklists }));
    await screen.findByRole('radio', { name: strings.checklists.active, checked: true });
    expect(screen.getByRole('header', { name: strings.nav.routines })).toBeTruthy();
    fireEvent.press(screen.getByRole('tab', { name: strings.nav.home }));
    await screen.findByText(strings.dashboard.emptyTasks);
    fireEvent.press(screen.getByRole('tab', { name: strings.nav.routines }));
    await screen.findByRole('header', { name: strings.nav.routines });
    fireEvent.press(screen.getByRole('tab', { name: strings.nav.profile }));
    await screen.findByText(strings.session.roles.ASSESSOR);
    fireEvent.press(screen.getByRole('button', { name: strings.session.logout }));
    await screen.findByRole('button', { name: strings.auth.submit });
    await waitFor(() => expect(screen.queryByRole('header', { name: strings.dashboard.greeting('Pessoa') })).toBeNull());
  } finally {
    fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous;
  }
});
it('jornada real: login, tarefa, início, conclusão, histórico e logout', async () => {
  const previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; let task = taskFixture();
  const fetcher = jest.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
    const path = new URL(String(url)).pathname;
    if (path === '/auth/login') return Promise.resolve(new Response(JSON.stringify(authResponse('ASSESSOR'))));
    if (path === '/auth/logout') return Promise.resolve(new Response(null, { status: 204 }));
    if (path === '/routines') return Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null })));
    if (path === '/tasks') return Promise.resolve(new Response(JSON.stringify({ items: [task], nextCursor: null })));
    if (path.endsWith('/status')) { task = taskFixture({ status: task.status === 'ABERTA' ? 'EM_ANDAMENTO' : 'CONCLUIDA' }); return Promise.resolve(new Response(JSON.stringify(task))); }
    if (path.endsWith('/history')) return Promise.resolve(new Response(JSON.stringify({ items: [{ id: 'event-42', taskId: task.id, actorId: 'actor', type: 'STATUS_CHANGED', fromStatus: 'EM_ANDAMENTO', toStatus: 'CONCLUIDA', fromAssigneeId: null, toAssigneeId: null, changedFields: [], createdAt: '2026-10-12T12:00:00Z' }], nextCursor: null })));
    if (path === '/tasks/task-1') return Promise.resolve(new Response(JSON.stringify(task))); return Promise.reject(new Error(`Endpoint não previsto: ${path}`));
  });
  try {
    renderApp(); await enter(); fireEvent.press(await screen.findByRole('button', { name: 'Tarefa fictícia' })); fireEvent.press(await screen.findByRole('button', { name: strings.tasks.start }));
    const complete = await screen.findByRole('button', { name: strings.tasks.complete }); await waitFor(() => expect(complete.props.accessibilityState.disabled).toBe(false)); fireEvent.press(complete);
    await screen.findByText(strings.tasks.closed); fireEvent.press(screen.getByRole('button', { name: strings.tasks.history }));
    await screen.findByText(strings.tasks.historyChange(strings.dashboard.status.EM_ANDAMENTO, strings.dashboard.status.CONCLUIDA), { exact: false });
    expect(task.status).toBe('CONCLUIDA'); fireEvent.press(screen.getByRole('tab', { name: strings.nav.profile })); await screen.findByRole('button', { name: strings.session.logout }); await leave();
  } finally { cleanup(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; }
});
it('jornada real da chefia: cadastro, erro de rede na edição, recuperação e arquivamento', async () => {
  const previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; let contact = contactFixture(); let failEdit = true;
  const fetcher = jest.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
    const path = new URL(String(url)).pathname;
    if (path === '/auth/login') return Promise.resolve(new Response(JSON.stringify(authResponse('CHEFE')))); if (path === '/auth/logout') return Promise.resolve(new Response(null, { status: 204 }));
    if (path === '/tasks' || path === '/routines') return Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null })));
    if (path === '/contacts' && init?.method === 'POST') { contact = contactFixture(createContactSchema.parse(JSON.parse(String(init.body)))); return Promise.resolve(new Response(JSON.stringify(contact), { status: 201 })); }
    if (path === '/contacts') return Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null })));
    if (path === '/contacts/contact-1' && init?.method === 'PATCH') { if (failEdit) { failEdit = false; return Promise.resolve(new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Detalhe interno' } }), { status: 503 })); } contact = contactFixture({ ...contact, ...updateContactSchema.parse(JSON.parse(String(init.body))) }); }
    if (path === '/contacts/contact-1' && init?.method === 'DELETE') { contact = contactFixture({ ...contact, isArchived: true }); return Promise.resolve(new Response(null, { status: 204 })); }
    if (path === '/contacts/contact-1') return Promise.resolve(new Response(JSON.stringify(contact))); return Promise.reject(new Error(`Endpoint não previsto: ${path}`));
  });
  try {
    renderApp();
    await enter();
    fireEvent.press(screen.getByRole('tab', { name: strings.nav.cabinet }));
    await screen.findByText(strings.cabinet.description);
    expect(screen.getByRole('button', { name: strings.nav.guidelines }).props.accessibilityHint).toBe(strings.cabinet.guidelines);
    expect(screen.getByRole('button', { name: strings.nav.transition }).props.accessibilityHint).toBe(strings.cabinet.transition);
    const contactsLink = screen.getByRole('button', { name: strings.nav.contacts });
    expect(contactsLink.props.accessibilityHint).toBe(strings.cabinet.contacts);
    fireEvent.press(contactsLink);
    fireEvent.press(await screen.findByRole('button', { name: strings.contacts.create }));
    fireEvent.press(await screen.findByRole('button', { name: strings.routines.save })); await screen.findByText(strings.contacts.validation.name);
    fireEvent.changeText(screen.getByLabelText(strings.contacts.name), 'Contato da jornada'); fireEvent.changeText(screen.getByLabelText(strings.contacts.organization), 'Tribunal fictício'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
    fireEvent.press(await screen.findByRole('button', { name: strings.contacts.edit })); fireEvent.changeText(await screen.findByLabelText(strings.contacts.notes), 'Observação preservada'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
    await screen.findByText(strings.auth.network); expect(screen.getByLabelText(strings.contacts.notes).props.value).toBe('Observação preservada'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
    fireEvent.press(await screen.findByRole('button', { name: strings.contacts.archive })); expect(contact.isArchived).toBe(false); fireEvent.press(screen.getByRole('button', { name: strings.contacts.confirmArchive })); await screen.findByText(strings.contacts.archivedLabel);
    expect(contact.notes).toBe('Observação preservada'); fireEvent.press(screen.getByRole('tab', { name: strings.nav.profile })); await screen.findByRole('button', { name: strings.session.logout }); await leave();
  } finally { cleanup(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; }
});
