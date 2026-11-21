import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { dashboardFixture, routineFixture } from '../dashboard/fixtures.test-helper';
import { RoutineForm } from './form';
import { templateFixture } from '../checklists/fixtures.test-helper';
import { RoutineDetailScreen, RoutineFormScreen, RoutineListScreen } from './screens';
import { strings } from '../../lib/strings';
const mockPush = jest.fn(); const mockReplace = jest.fn(); let mockParams: { id?: string; scope?: string } = {};
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, canGoBack: () => false }), useLocalSearchParams: () => mockParams }));
jest.mock('@shopify/flash-list', () => { const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native'); return { FlashList: FlatList }; });
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
let fixture: Awaited<ReturnType<typeof dashboardFixture>>; let fetcher: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>; let previous: string | undefined;
beforeEach(async () => { jest.useFakeTimers(); previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; fixture = await dashboardFixture(); fetcher = jest.spyOn(globalThis, 'fetch'); mockParams = {}; mockPush.mockClear(); mockReplace.mockClear(); });
afterEach(() => { cleanup(); fixture.client.clear(); act(() => jest.runOnlyPendingTimers()); jest.useRealTimers(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
function chief(): void { const user = fixture.manager.store.getState().user; if (!user) throw new Error('Usuário ausente.'); fixture.manager.store.setState({ user: { ...user, role: 'CHEFE' } }); }
it('catálogo busca, filtra e abre detalhes; assessor não recebe botão de cadastro', async () => {
  fetcher.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ items: [routineFixture()], nextCursor: null }))));
  fixture.show(<RoutineListScreen />); await screen.findByRole('button', { name: 'Rotina fictícia' }); expect(screen.queryByRole('button', { name: strings.routines.create })).toBeNull();
  fireEvent.changeText(screen.getByLabelText(strings.routines.search), ' e-mail '); fireEvent.press(screen.getByRole('button', { name: strings.routines.searchAction }));
  await waitFor(() => expect(fetcher.mock.calls.some((call) => String(call[0]).includes('q=e-mail'))).toBe(true));
  fireEvent.press(screen.getByRole('radio', { name: strings.routines.archived }));
  await waitFor(() => expect(fetcher.mock.calls.some((call) => String(call[0]).includes('isArchived=true'))).toBe(true));
  fireEvent.press(await screen.findByRole('button', { name: 'Rotina fictícia' })); expect(mockPush).toHaveBeenCalledWith({ pathname: '/rotina/[id]', params: { id: 'routine-1' } });
});
it('escopo de hoje compartilha a frequência e não antecipa contagens de página', async () => {
  chief();
  mockParams = { scope: 'today' };
  const daily = routineFixture({ title: 'Rotina diária fictícia', defaultPosition: 'APOIO', essentialForTransition: true });
  const specific = routineFixture({ id: 'dated', title: 'Rotina com data fictícia', specificDate: '2026-11-20' });
  fetcher.mockImplementation((url) => {
    const path = new URL(String(url));
    const next = path.searchParams.has('cursor');
    const page = next ? { items: [specific], nextCursor: null } : { items: [daily], nextCursor: 'next' };
    return Promise.resolve(new Response(JSON.stringify(page)));
  });
  fixture.show(<RoutineListScreen />);
  await screen.findByRole('header', { name: strings.routines.cadence.DIARIA });
  expect(screen.queryByRole('header', { name: strings.feedback.groupCount(strings.routines.cadence.DIARIA, 1) })).toBeNull();
  expect(screen.getByRole('button', { name: strings.routines.metadata(daily.title, strings.routines.essential) })).toBeTruthy();
  expect(screen.getByText(strings.routines.metadata(daily.category, strings.routines.positions.APOIO))).toBeTruthy();
  expect(new URL(String(fetcher.mock.calls[0]?.[0])).searchParams.get('scheduledFor')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore }));
  await screen.findByRole('header', { name: strings.feedback.groupCount(strings.routines.specificDate, 1) });
  fireEvent.press(screen.getByRole('togglebutton', { name: strings.routines.frequency }));
  fireEvent.press(screen.getByRole('radio', { name: strings.dashboard.frequency.DIARIA }));
  await waitFor(() => {
    const params = new URL(String(fetcher.mock.calls.at(-1)?.[0])).searchParams;
    expect(params.get('frequency')).toBe('DIARIA');
    expect(params.get('scheduledFor')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  fireEvent.press(screen.getByRole('button', { name: strings.routines.create }));
  expect(mockPush).toHaveBeenCalledWith('/rotina/nova');
});
it('link direto de criação não habilita manutenção para assessor', async () => {
  fixture.show(<RoutineFormScreen mode="create" />);
  expect(screen.getByRole('header', { name: strings.routines.forbiddenTitle })).toBeTruthy();
  expect(screen.getByText(strings.routines.forbidden)).toBeTruthy();
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: strings.routines.backToList }));
  expect(mockReplace).toHaveBeenCalledWith('/rotinas');
});
it('formulário bloqueia dados inválidos, preserva entrada em falha e permite tentar salvar', async () => {
  chief(); const saved = jest.fn(); fetcher.mockResolvedValue(new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: 'Interno' } }), { status: 503 }));
  fixture.show(<RoutineForm onSaved={saved} onCancel={() => undefined} />); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await screen.findByText(strings.routines.validation.title); expect(fetcher).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText(strings.routines.name), 'Rotina nova'); fireEvent.changeText(screen.getByLabelText(strings.routines.category), 'Administrativo');
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await screen.findByText(strings.auth.network);
  expect(screen.getByLabelText(strings.routines.name).props.value).toBe('Rotina nova');
  fetcher.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(routineFixture({ title: 'Rotina nova' })), { status: 201 })));
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await waitFor(() => expect(saved).toHaveBeenCalled());
});
it('editar mantém opcionais e envia somente alteração explícita', async () => {
  chief(); const routine = routineFixture({ steps: ['Primeiro\ncom orientação', 'Segundo'], specificDate: '2027-02-01', defaultPosition: 'APOIO' }); const saved = jest.fn();
  fetcher.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ...routine, title: 'Título atualizado' }))));
  fixture.show(<RoutineForm routine={routine} onSaved={saved} onCancel={() => undefined} />);
  fireEvent.changeText(screen.getByLabelText(strings.routines.name), 'Título atualizado'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(fetcher.mock.calls[0]?.[1]?.method).toBe('PATCH'); expect(fetcher.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ title: 'Título atualizado' }));
});
it('reordenar passos mantém o conteúdo multiline e altera somente steps', async () => {
  chief(); const routine = routineFixture({ steps: ['Primeiro\ncom orientação', 'Segundo'] }); const saved = jest.fn();
  fetcher.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ ...routine, steps: ['Segundo', 'Primeiro\ncom orientação'] }))));
  fixture.show(<RoutineForm routine={routine} onSaved={saved} onCancel={() => undefined} />);
  fireEvent.press(screen.getByRole('button', { name: strings.routines.moveDown(0) }));
  expect(screen.getByLabelText(strings.routines.step(0)).props.value).toBe('Segundo'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await waitFor(() => expect(saved).toHaveBeenCalled()); expect(fetcher.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ steps: ['Segundo', 'Primeiro\ncom orientação'] }));
});
it('cancelar formulário alterado requer confirmação de descarte', async () => {
  chief(); const cancel = jest.fn(); fixture.show(<RoutineForm onSaved={() => undefined} onCancel={cancel} />);
  fireEvent.changeText(screen.getByLabelText(strings.routines.name), 'Rascunho fictício'); fireEvent.press(screen.getByRole('button', { name: strings.routines.cancel }));
  expect(screen.getByRole('header', { name: strings.routines.unsavedTitle })).toBeTruthy();
  expect(cancel).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: strings.routines.discard }));
  expect(cancel).toHaveBeenCalledTimes(1);
});
it('configura frequência personalizada, cargo e guia de transição sem mudar o payload', async () => {
  chief();
  const saved = jest.fn();
  fetcher.mockImplementation(() => Promise.resolve(new Response(JSON.stringify(routineFixture()), { status: 201 })));
  fixture.show(<RoutineForm onSaved={saved} onCancel={() => undefined} />);
  expect(screen.queryByLabelText(strings.routines.frequencyDetails)).toBeNull();
  fireEvent.changeText(screen.getByLabelText(strings.routines.name), 'Rotina fictícia personalizada');
  fireEvent.changeText(screen.getByLabelText(strings.routines.category), 'Sessões fictícias');
  fireEvent.press(screen.getByRole('radio', { name: strings.dashboard.frequency.PERSONALIZADA }));
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await screen.findByText(strings.routines.validation.frequencyDetails);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText(strings.routines.frequencyDetails), 'Quando a pauta fictícia for publicada.');
  fireEvent.changeText(screen.getByLabelText(strings.routines.specificDate), '01/02/2027');
  fireEvent.press(screen.getByRole('button', { name: strings.routines.defaultPosition }));
  fireEvent.press(screen.getByRole('radio', { name: strings.routines.positions.APOIO }));
  fireEvent.press(screen.getByRole('switch', { name: strings.routines.essential }));
  fireEvent.press(screen.getByRole('button', { name: strings.routines.addStep }));
  fireEvent.changeText(screen.getByLabelText(strings.routines.step(0)), 'Revisar a pauta fictícia.');
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(fetcher.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({
    title: 'Rotina fictícia personalizada', category: 'Sessões fictícias', frequency: 'PERSONALIZADA',
    description: '', instructions: '', steps: ['Revisar a pauta fictícia.'], frequencyDetails: 'Quando a pauta fictícia for publicada.',
    specificDate: '2027-02-01', defaultPosition: 'APOIO', essentialForTransition: true,
  }));
});
it('arquivamento exige confirmação e detalhe arquivado não oferece edição', async () => {
  chief(); mockParams = { id: 'routine-1' }; let archived = false;
  fetcher.mockImplementation((url, init) => { if (init?.method === 'DELETE') { archived = true; return Promise.resolve(new Response(null, { status: 204 })); }
    if (String(url).includes('/checklists/templates?')) return Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null })));
    return Promise.resolve(new Response(JSON.stringify(routineFixture({ isArchived: archived })))); });
  fixture.show(<RoutineDetailScreen />); await screen.findByRole('button', { name: strings.routines.archive });
  fireEvent.press(screen.getByRole('button', { name: strings.routines.archive })); expect(fetcher.mock.calls.some((call) => call[1]?.method === 'DELETE')).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: strings.routines.confirmArchive })); await screen.findByText(strings.routines.archivedLabel);
  expect(screen.queryByRole('button', { name: strings.routines.edit })).toBeNull();
});
it('detalhe usa os modelos ativos da rotina e abre a ação de hoje com único modelo', async () => {
  mockParams = { id: 'routine-1' };
  const template = templateFixture({ version: 3 });
  const routine = routineFixture({ essentialForTransition: true, steps: ['Revisar documento fictício.'] });
  fetcher.mockImplementation((url) => {
    const path = new URL(String(url));
    return Promise.resolve(new Response(JSON.stringify(path.pathname === '/checklists/templates' ? { items: [template], nextCursor: null } : routine)));
  });
  fixture.show(<RoutineDetailScreen />);
  await screen.findByText(strings.checklists.modelSummary(strings.checklists.version(3), strings.checklists.itemCount(1)));
  expect(screen.getByText(strings.routines.essential)).toBeTruthy();
  expect(screen.getByLabelText(strings.routines.stepDescription(0, 'Revisar documento fictício.'))).toBeTruthy();
  expect(screen.queryByRole('button', { name: strings.checklists.create })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: strings.routines.startTodayChecklist }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/checklist/[id]', params: { id: template.id } });
  const list = fetcher.mock.calls.map(([url]) => new URL(String(url))).find(({ pathname }) => pathname === '/checklists/templates');
  expect(list?.searchParams.get('routineId')).toBe(routine.id);
  expect(list?.searchParams.get('isArchived')).toBe('false');
});
it('detalhe não sugere modelo único enquanto existir outra página', async () => {
  mockParams = { id: 'routine-1' };
  fetcher.mockImplementation((url) => {
    const path = new URL(String(url));
    const page = path.searchParams.has('cursor')
      ? { items: [templateFixture({ id: 'template-2', title: 'Segunda lista fictícia' })], nextCursor: null }
      : { items: [templateFixture()], nextCursor: 'next-page' };
    return Promise.resolve(new Response(JSON.stringify(path.pathname === '/checklists/templates' ? page : routineFixture())));
  });
  fixture.show(<RoutineDetailScreen />);
  await screen.findByRole('button', { name: 'Checklist fictício' });
  expect(screen.queryByRole('button', { name: strings.routines.startTodayChecklist })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore }));
  await screen.findByRole('button', { name: 'Segunda lista fictícia' });
  expect(screen.queryByRole('button', { name: strings.routines.startTodayChecklist })).toBeNull();
});
