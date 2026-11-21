import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { transitionGuideSchema, transitionSnapshotSchema } from '@gabinete-plus/shared';
import { dashboardFixture, routineFixture } from '../dashboard/fixtures.test-helper';
import { TransitionGuideScreen, TransitionCopiesScreen, TransitionCopyScreen, TransitionCuratorScreen, TransitionForm } from './screens';
import { strings } from '../../lib/strings';
const mockReplace = jest.fn(); const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }), useLocalSearchParams: () => ({ id: 'copy-1' }) }));
jest.mock('@shopify/flash-list', () => { const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native'); return { FlashList: FlatList }; });
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
const settings = { overview: 'Visão geral fictícia', notes: 'Notas fictícias', revision: 2 };
const guide = transitionGuideSchema.parse({ settings, generatedAt: '2026-10-12T12:00:00Z', section: { kind: 'ROUTINES', items: [], nextCursor: null } });
const copy = transitionSnapshotSchema.parse({ id: 'copy-1', title: 'Estado preservado fictício', version: 1, authorId: 'actor', authorName: 'Pessoa fictícia', createdAt: guide.generatedAt, content: { overview: 'Visão original preservada', notes: 'Notas originais', routines: [], guidelines: [], contacts: [], tasks: [] } });
let fixture: Awaited<ReturnType<typeof dashboardFixture>>; let fetcher: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>; let previous: string | undefined;
beforeEach(async () => { jest.useFakeTimers(); previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; fixture = await dashboardFixture(); fetcher = jest.spyOn(globalThis, 'fetch'); mockReplace.mockClear(); mockPush.mockClear(); });
afterEach(() => { cleanup(); fixture.client.clear(); act(() => jest.runOnlyPendingTimers()); jest.useRealTimers(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
function chief() { const user = fixture.manager.store.getState().user; if (!user) throw new Error('Usuário ausente.'); fixture.manager.store.setState({ user: { ...user, role: 'CHEFE' } }); }
it('guia apresenta as seis seções e consulta cada lista uma vez para assessor', async () => {
  fetcher.mockImplementation((url) => {
    const kind = new URL(String(url)).searchParams.get('section');
    return Promise.resolve(new Response(JSON.stringify({ ...guide, section: { ...guide.section, kind } })));
  });
  fixture.show(<TransitionGuideScreen />);
  await screen.findByText(settings.overview);
  expect(screen.getByText(settings.notes)).toBeTruthy();
  expect(screen.getAllByRole('radio')).toHaveLength(6);
  expect(screen.queryByRole('button', { name: strings.transition.curate })).toBeNull();
  expect(fetcher.mock.calls.map(([url]) => new URL(String(url)).searchParams.get('section')).sort())
    .toEqual(['CONTACTS', 'GUIDELINES', 'ROUTINES', 'TASKS']);
});
it('erro em uma lista preserva as outras seções e refaz só a consulta que falhou', async () => {
  const failed: string[] = [];
  fetcher.mockImplementation((url) => {
    const kind = new URL(String(url)).searchParams.get('section') ?? '';
    if (kind === 'TASKS' && !failed.length) {
      failed.push(kind);
      return Promise.reject(new Error('Falha fictícia.'));
    }
    return Promise.resolve(new Response(JSON.stringify({ ...guide, section: { ...guide.section, kind } })));
  });
  fixture.show(<TransitionGuideScreen />);
  await screen.findByText(settings.overview);
  fireEvent.press(await screen.findByRole('button', { name: strings.feedback.retry }));
  await waitFor(() => expect(screen.queryByRole('button', { name: strings.feedback.retry })).toBeNull());
  expect(fetcher.mock.calls).toHaveLength(5);
  expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('section=TASKS');
});
it('cópia abre detalhes preservados dentro da tela e não consulta o guia atual', async () => {
  const routine = routineFixture({ title: 'Rotina fictícia preservada', instructions: 'Instruções preservadas de demonstração.' });
  const snapshot = { ...copy, content: { ...copy.content, routines: [routine] } };
  fetcher.mockResolvedValue(new Response(JSON.stringify(snapshot)));
  fixture.show(<TransitionCopyScreen />);
  await screen.findByText(copy.content.overview);
  expect(screen.getByText(strings.transition.preserved)).toBeTruthy();
  expect(screen.getByRole('header', { name: strings.transition.notes })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: routine.title }));
  expect(await screen.findByText(routine.instructions)).toBeTruthy();
  expect(mockPush).not.toHaveBeenCalled();
  expect(fetcher.mock.calls).toHaveLength(1);
  expect(String(fetcher.mock.calls[0]?.[0])).toContain('/snapshots/copy-1');
});
it('consulta de cópia inexistente apresenta a mensagem do contrato', async () => {
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'TRANSITION_NOT_FOUND', message: 'Cópia inexistente.' } }), { status: 404 }));
  fixture.show(<TransitionCopyScreen />);
  expect(await screen.findByText(strings.transition.notFound)).toBeTruthy();
});
it('lista paginada mantém autoria, versão e acesso à cópia selecionada', async () => {
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...copy, id: 'copy-2', version: 2, title: 'Segunda cópia fictícia' }], nextCursor: '2' })));
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ items: [copy], nextCursor: null })));
  fixture.show(<TransitionCopiesScreen />);
  expect(await screen.findByText(strings.transition.immutable)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore }));
  const first = await screen.findByRole('button', { name: copy.title });
  expect(first.props.accessibilityHint).toContain(strings.transition.generatedBy('12/10/2026', copy.authorName));
  expect(first.props.accessibilityHint).toContain(strings.guidelines.version(1));
  expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('cursor=2');
  fireEvent.press(first);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/transicao/copia/[id]', params: { id: copy.id } });
});
it('lista de cópias sem registros informa estado vazio', async () => {
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ items: [], nextCursor: null })));
  fixture.show(<TransitionCopiesScreen />);
  expect(await screen.findByText(strings.transition.noCopies)).toBeTruthy();
});
it('assessor não acessa curadoria por rota direta', () => { fixture.show(<TransitionCuratorScreen />); expect(screen.getByText(strings.transition.forbidden)).toBeTruthy(); expect(fetcher).not.toHaveBeenCalled(); });
it('curadoria preserva texto quando a revisão entra em conflito', async () => { chief(); fetcher.mockResolvedValue(new Response(JSON.stringify({ error: { code: 'TRANSITION_CONFLICT', message: 'Conflito' } }), { status: 409 })); fixture.show(<TransitionForm settings={settings} />); fireEvent.changeText(screen.getByLabelText(strings.transition.overview), 'Rascunho preservado'); fireEvent.press(screen.getByRole('button', { name: strings.transition.saveSettings })); await screen.findByText(strings.transition.conflict); expect(screen.getByLabelText(strings.transition.overview).props.value).toBe('Rascunho preservado'); expect(fetcher.mock.calls[0]?.[1]?.body).toContain('"expectedRevision":2'); });
it('geração só envia o título validado após confirmar a cópia', async () => {
  chief();
  fetcher.mockResolvedValue(new Response(JSON.stringify(copy)));
  fixture.show(<TransitionForm settings={settings} />);
  fireEvent.press(screen.getByRole('button', { name: strings.transition.generate }));
  await screen.findByText(strings.transition.validation);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText(strings.transition.copyTitle), 'Estado fictício');
  fireEvent.press(screen.getByRole('button', { name: strings.transition.generate }));
  const confirm = await screen.findByRole('button', { name: strings.transition.confirmGeneration });
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.press(confirm);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/transicao/copia/[id]', params: { id: copy.id } }));
});
it('salva informações, mostra sucesso e usa a nova revisão na geração', async () => {
  chief();
  const updated = { ...settings, notes: 'Anotações atualizadas de demonstração.', revision: 3 };
  fetcher.mockImplementation((_url, init) => Promise.resolve(new Response(JSON.stringify(init?.method === 'PATCH' ? updated : copy))));
  fixture.show(<TransitionForm settings={settings} />);
  fireEvent.changeText(screen.getByLabelText(strings.transition.copyTitle), 'Título preservado fictício');
  fireEvent.changeText(screen.getByLabelText(strings.transition.notes), updated.notes);
  expect(screen.getByRole('button', { name: strings.transition.generate }).props.accessibilityState.disabled).toBe(true);
  fireEvent.press(screen.getByRole('button', { name: strings.transition.saveSettings }));
  await screen.findByText(strings.transition.saved);
  fireEvent.press(screen.getByRole('button', { name: strings.transition.generate }));
  fireEvent.press(await screen.findByRole('button', { name: strings.transition.confirmGeneration }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  expect(JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body))).toEqual({ title: 'Título preservado fictício', expectedRevision: 3 });
});
