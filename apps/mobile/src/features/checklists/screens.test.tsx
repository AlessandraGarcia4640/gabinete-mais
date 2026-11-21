import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { dashboardFixture, routineFixture, taskFixture } from '../dashboard/fixtures.test-helper';
import { gabineteDate } from '../dashboard/model';
import { templateFixture, runFixture } from './fixtures.test-helper';
import { ChecklistDetailScreen, ChecklistFormScreen, ChecklistHistoryScreen, ChecklistListScreen, ChecklistRunScreen } from './screens';
import { ChecklistForm } from './form';
import { optimisticMark } from './model';
import { strings } from '../../lib/strings';
const mockPush = jest.fn(); const mockReplace = jest.fn(); let mockParams: { id?: string; routineId?: string; templateId?: string; taskId?: string } = {};
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, canGoBack: () => false }), useLocalSearchParams: () => mockParams }));
jest.mock('@shopify/flash-list', () => { const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native'); return { FlashList: FlatList }; });
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
let fixture: Awaited<ReturnType<typeof dashboardFixture>>; let fetcher: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>; let previous: string | undefined;
beforeEach(async () => { jest.useFakeTimers(); previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; fixture = await dashboardFixture(); fetcher = jest.spyOn(globalThis, 'fetch'); mockParams = {}; mockPush.mockClear(); mockReplace.mockClear(); });
afterEach(() => { cleanup(); fixture.client.clear(); act(() => jest.runOnlyPendingTimers()); jest.useRealTimers(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
function chief() { const user = fixture.manager.store.getState().user; if (!user) throw new Error('Usuário ausente.'); fixture.manager.store.setState({ user: { ...user, role: 'CHEFE' } }); }
function response(value: object) { return Promise.resolve(new Response(JSON.stringify(value))); }
it('catálogo pagina por cursor, filtra arquivo e abre modelo', async () => {
  mockParams = { routineId: 'routine-1' };
  fetcher.mockImplementation((url) => response({ items: [templateFixture({ id: String(url).includes('cursor=') ? 'template-2' : 'template-1' })], nextCursor: String(url).includes('cursor=') ? null : 'template-1' }));
  fixture.show(<ChecklistListScreen />); await screen.findByRole('button', { name: 'Checklist fictício' }); fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore }));
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Checklist fictício' })).toHaveLength(2));
  expect(screen.getAllByText(strings.checklists.modelSummary(strings.checklists.version(1), strings.checklists.itemCount(1)))).toHaveLength(2);
  expect(screen.getByText(strings.checklists.createFromRoutine)).toBeTruthy();
  expect(screen.queryByRole('button', { name: strings.checklists.create })).toBeNull();
  expect(fetcher.mock.calls.some((call) => String(call[0]).includes('cursor=template-1'))).toBe(true);
  fireEvent.press(screen.getByRole('radio', { name: strings.checklists.archived })); await waitFor(() => expect(fetcher.mock.calls.some((call) => String(call[0]).includes('isArchived=true'))).toBe(true));
  const buttons = await screen.findAllByRole('button', { name: 'Checklist fictício' }); fireEvent.press(buttons[0]); expect(mockPush).toHaveBeenCalledWith({ pathname: '/checklist/[id]', params: { id: 'template-1' } });
  expect(fetcher.mock.calls.map(([url]) => new URL(String(url)).searchParams.get('routineId'))).toEqual(['routine-1', 'routine-1', 'routine-1']);
});
it('lista vazia e falha permitem nova tentativa', async () => {
  fetcher.mockRejectedValue(new Error('offline')); fixture.show(<ChecklistListScreen />); await screen.findByText(strings.feedback.error);
  fetcher.mockImplementation(() => response({ items: [], nextCursor: null })); fireEvent.press(screen.getByRole('button', { name: strings.feedback.retry })); await screen.findByText(strings.checklists.empty);
});
it('histórico filtra pessoa e modelo e navega para execução', async () => {
  mockParams = { templateId: 'template-1', routineId: 'routine-1' };
  const run = runFixture({ periodStart: gabineteDate(), totalItems: 2, completedItems: 1, status: 'EM_ANDAMENTO', progress: 50 });
  const name = 'Integrante Fictício';
  fetcher.mockImplementation((url) => {
    const path = new URL(String(url));
    if (path.pathname === '/users/other') return response({
      id: 'other', name, email: 'outra-pessoa@example.invalid', role: 'APOIO', position: 'APOIO', isActive: true,
      createdAt: '2026-10-12T12:00:00Z', updatedAt: '2026-10-12T12:00:00Z',
    });
    return response({ items: [path.searchParams.has('assigneeId') ? run : { ...run, assigneeId: 'other' }], nextCursor: null });
  });
  fixture.show(<ChecklistHistoryScreen />);
  await screen.findByRole('header', { name: strings.checklists.currentWeek });
  expect(screen.getByText(strings.checklists.progressFraction(1, 2))).toBeTruthy();
  expect(screen.queryByText(strings.checklists.personUnavailable)).toBeNull();
  const initial = new URL(String(fetcher.mock.calls[0]?.[0])).searchParams;
  expect(initial.get('assigneeId')).toBe('actor');
  expect(initial.get('templateId')).toBe('template-1');
  expect(initial.get('routineId')).toBe('routine-1');
  expect(fetcher.mock.calls.some(([url]) => String(url).includes('/users/'))).toBe(false);
  fireEvent.press(screen.getByRole('radio', { name: strings.checklists.allRuns }));
  await screen.findByText(strings.routines.metadata(run.titleSnapshot, name));
  const all = fetcher.mock.calls.map(([url]) => new URL(String(url))).find((url) => url.pathname.endsWith('/runs') && !url.searchParams.has('assigneeId'));
  expect(all?.searchParams.get('routineId')).toBe('routine-1');
  expect(all?.searchParams.get('templateId')).toBe('template-1');
  fireEvent.press(screen.getByRole('button', { name: /Checklist fictício/ }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/execucao/[id]', params: { id: 'run-1' } });
});
it('histórico preserva as linhas durante erro de paginação e tenta o mesmo cursor de novo', async () => {
  const first = runFixture({ periodStart: gabineteDate() });
  const second = runFixture({ id: 'run-2', periodStart: '2000-01-01', titleSnapshot: 'Execução fictícia anterior' });
  let failed = false;
  fetcher.mockImplementation((url) => {
    const cursor = new URL(String(url)).searchParams.get('cursor');
    if (!cursor) return response({ items: [first], nextCursor: 'run-1' });
    if (!failed) { failed = true; return Promise.reject(new Error('offline')); }
    return response({ items: [second], nextCursor: null });
  });
  fixture.show(<ChecklistHistoryScreen />);
  await screen.findByRole('header', { name: strings.checklists.currentWeek });
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore }));
  await screen.findByText(strings.feedback.updatingError);
  expect(screen.getByText(first.titleSnapshot)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.retry }));
  await screen.findByRole('header', { name: strings.checklists.otherRunDates });
  expect(screen.getByText(second.titleSnapshot)).toBeTruthy();
  expect(fetcher.mock.calls.map(([url]) => new URL(String(url)).searchParams.get('cursor'))).toEqual([null, 'run-1', 'run-1']);
});
it('formulário valida, usa passos da rotina e conserva dados após falha', async () => {
  chief(); const saved = jest.fn(); fetcher.mockRejectedValue(new Error('offline')); fixture.show(<ChecklistForm routine={routineFixture({ steps: ['Passo original'] })} onSaved={saved} onCancel={() => undefined} />);
  expect(screen.getByLabelText(strings.checklists.item(0)).props.value).toBe('Passo original'); fireEvent.changeText(screen.getByLabelText(strings.checklists.name), ''); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await screen.findByText(strings.checklists.invalidTitle); expect(fetcher).not.toHaveBeenCalled(); fireEvent.changeText(screen.getByLabelText(strings.checklists.name), 'Novo modelo');
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await screen.findByText(strings.auth.network); expect(screen.getByLabelText(strings.checklists.item(0)).props.value).toBe('Passo original');
  fetcher.mockImplementation(() => response(templateFixture())); fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await waitFor(() => expect(saved).toHaveBeenCalled());
});
it('link direto não concede manutenção ao assessor', () => { fixture.show(<ChecklistFormScreen mode="create" />); expect(screen.getByText(strings.checklists.forbidden)).toBeTruthy(); expect(fetcher).not.toHaveBeenCalled(); });
it('chefia precisa entrar no cadastro por uma rotina', () => {
  chief();
  fixture.show(<ChecklistFormScreen mode="create" />);
  expect(screen.getByRole('header', { name: strings.checklists.create })).toBeTruthy();
  expect(screen.getByText(strings.checklists.notFound)).toBeTruthy();
  expect(fetcher).not.toHaveBeenCalled();
});
it('edição reordena itens e envia somente o conteúdo alterado', async () => {
  chief(); const saved = jest.fn(); const template = templateFixture({ items: ['Primeiro\nOrientação', 'Segundo'] }); fetcher.mockImplementation(() => response({ ...template, items: ['Segundo', 'Primeiro\nOrientação'] }));
  fixture.show(<ChecklistForm routine={routineFixture()} template={template} onSaved={saved} onCancel={() => undefined} />); fireEvent.press(screen.getByRole('button', { name: strings.checklists.down(0) }));
  expect(screen.getByLabelText(strings.checklists.item(0)).props.value).toBe('Segundo'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(fetcher.mock.calls[0]?.[1]?.method).toBe('PATCH'); expect(fetcher.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ items: ['Segundo', 'Primeiro\nOrientação'] }));
});
it('edição mostra a próxima versão, valida a lista vazia e confirma o descarte', async () => {
  chief();
  const cancel = jest.fn();
  fixture.show(<ChecklistForm routine={routineFixture()} template={templateFixture({ version: 3 })}
    onSaved={() => undefined} onCancel={cancel} />);
  expect(screen.getByText(strings.checklists.nextVersion(3))).toBeTruthy();
  expect(screen.getByText(strings.checklists.itemLimits)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: strings.checklists.remove(0) }));
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await screen.findByText(strings.checklists.invalidItems);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: strings.routines.cancel }));
  expect(screen.getByRole('header', { name: strings.routines.unsavedTitle })).toBeTruthy();
  expect(cancel).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: strings.routines.discard }));
  expect(cancel).toHaveBeenCalledTimes(1);
});
it('resposta tardia após sair não restaura o cache da execução', async () => {
  mockParams = { id: 'run-1' }; let finish: ((value: Response) => void) | undefined;
  fetcher.mockImplementation((_url, init) => init?.method === 'PATCH' ? new Promise<Response>((resolve) => { finish = resolve; }) : response(runFixture()));
  fixture.show(<ChecklistRunScreen />); await screen.findByRole('checkbox'); fireEvent.press(screen.getByRole('checkbox')); await screen.findByRole('progressbar', { value: { now: 1 } });
  await act(async () => { cleanup(); await fixture.manager.logout(); if (!finish) throw new Error('Requisição ausente.'); finish(new Response(JSON.stringify(optimisticMark(runFixture(), 'item-1', true, 'actor')))); });
  expect(fixture.client.getQueryData(['checklist-run', 'run-1', 'actor'])).toBeUndefined();
});
it('início é explícito, valida data e abre a execução retornada', async () => {
  mockParams = { id: 'template-1' }; fetcher.mockImplementation((url, init) => response(init?.method === 'POST' ? runFixture() : String(url).includes('/routines/') ? routineFixture() : templateFixture()));
  fixture.show(<ChecklistDetailScreen />); await screen.findByRole('button', { name: strings.checklists.startToday }); expect(fetcher.mock.calls.some((call) => call[1]?.method === 'POST')).toBe(false);
  expect(screen.getByLabelText(strings.checklists.itemDescription(0, 'Conferir caixa'))).toBeTruthy();
  expect(screen.queryByRole('button', { name: strings.checklists.edit })).toBeNull();
  fireEvent.changeText(screen.getByLabelText(strings.checklists.date), '31/02/2026'); fireEvent.press(screen.getByRole('button', { name: strings.checklists.start })); await screen.findByText(strings.routines.validation.specificDate);
  fireEvent.changeText(screen.getByLabelText(strings.checklists.date), '12/10/2026'); fireEvent.press(screen.getByRole('button', { name: strings.checklists.start })); await waitFor(() => expect(mockPush).toHaveBeenCalledWith({ pathname: '/execucao/[id]', params: { id: 'run-1' } }));
});
it('mostra conflito do período e mantém a referência após a falha', async () => {
  chief();
  mockParams = { id: 'template-1' };
  fetcher.mockImplementation((url, init) => {
    if (init?.method === 'POST') return Promise.resolve(new Response(JSON.stringify({
      error: { code: 'CHECKLIST_RUN_EXISTS', message: 'Já existe uma execução fictícia.' },
    }), { status: 409 }));
    return response(String(url).includes('/routines/') ? routineFixture() : templateFixture());
  });
  fixture.show(<ChecklistDetailScreen />);
  await screen.findByRole('button', { name: strings.checklists.startToday });
  fireEvent.changeText(screen.getByLabelText(strings.checklists.date), '12/10/2026');
  fireEvent.press(screen.getByRole('button', { name: strings.checklists.start }));
  await screen.findByText(strings.checklists.exists);
  expect(screen.getByLabelText(strings.checklists.date).props.value).toBe('12/10/2026');
  expect(mockPush).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: strings.checklists.history }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/execucoes', params: { templateId: 'template-1' } });
});
it('marcação otimista aparece antes da resposta e reverte em recusa de tarefa concluída', async () => {
  mockParams = { id: 'run-1' }; let fail: ((value: Response) => void) | undefined;
  fetcher.mockImplementation((_url, init) => init?.method === 'PATCH' ? new Promise<Response>((resolve) => { fail = resolve; }) : response(runFixture()));
  fixture.show(<ChecklistRunScreen />); await screen.findByRole('checkbox', { name: 'Conferir caixa' }); fireEvent.press(screen.getByRole('checkbox', { name: 'Conferir caixa' }));
  await screen.findByRole('progressbar', { value: { now: 1 } }); expect(screen.getByRole('checkbox').props.accessibilityState.disabled).toBe(true);
  await act(async () => { if (!fail) throw new Error('Requisição ausente.'); fail(new Response(JSON.stringify({ error: { code: 'CHECKLIST_TASK_COMPLETED', message: 'Conflito' } }), { status: 409 })); });
  await screen.findByText(strings.checklists.completedTask); await screen.findByRole('progressbar', { value: { now: 0 } }); expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(false);
});
it('marcar e desmarcar confirma a resposta do servidor', async () => {
  mockParams = { id: 'run-1' }; let run = runFixture(); fetcher.mockImplementation((_url, init) => { if (init?.method === 'PATCH') run = optimisticMark(run, 'item-1', run.completedItems === 0, 'actor'); return response(run); });
  fixture.show(<ChecklistRunScreen />); await screen.findByRole('checkbox'); fireEvent.press(screen.getByRole('checkbox')); await screen.findByRole('progressbar', { value: { now: 1 } }); await waitFor(() => expect(screen.getByRole('checkbox').props.accessibilityState.disabled).toBe(false));
  expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true); fireEvent.press(screen.getByRole('checkbox')); await screen.findByRole('progressbar', { value: { now: 0 } });
});
it('outra pessoa consulta snapshot mas não pode marcar', async () => { mockParams = { id: 'run-1' }; fetcher.mockImplementation(() => response(runFixture({ assigneeId: 'other' }))); fixture.show(<ChecklistRunScreen />);
  await screen.findByText(strings.checklists.readOnly);
  expect(screen.getByRole('checkbox').props.accessibilityState.disabled).toBe(true);
  fireEvent.press(screen.getByRole('checkbox'));
  expect(fetcher.mock.calls.some((call) => call[1]?.method === 'PATCH')).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: strings.checklists.showInstructions }));
  await screen.findByText('Orientação preservada');
});
it.each([true, false])('execução concluída confirma o vínculo da tarefa antes de oferecer o atalho (%s)', async (matches) => {
  mockParams = { id: 'run-1', taskId: 'task-1' };
  const run = optimisticMark(runFixture(), 'item-1', true, 'actor', '2026-10-12T13:00:00Z');
  const task = taskFixture({ id: 'task-1', checklistRunId: matches ? run.id : 'different-run' });
  fetcher.mockImplementation((url) => response(String(url).includes('/tasks/') ? task : run));
  fixture.show(<ChecklistRunScreen />);
  await screen.findByRole('progressbar', { value: { now: 1, max: 1 } });
  expect(screen.getByText(/12\/10 às 10:00/)).toBeTruthy();
  if (matches) {
    await screen.findByText(strings.checklists.completeWithTask);
    fireEvent.press(screen.getByRole('button', { name: strings.checklists.openLinkedTask }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tarefa/[id]', params: { id: task.id } });
  } else {
    expect(screen.getByText(strings.checklists.complete)).toBeTruthy();
    expect(screen.queryByRole('button', { name: strings.checklists.openLinkedTask })).toBeNull();
  }
});
it('arquiva somente com confirmação e mantém acesso ao histórico', async () => {
  chief(); mockParams = { id: 'template-1' }; let archived = false; fetcher.mockImplementation((url, init) => {
    if (init?.method === 'DELETE') { archived = true; return Promise.resolve(new Response(null, { status: 204 })); }
    return response(String(url).includes('/routines/') ? routineFixture() : templateFixture({ isArchived: archived }));
  }); fixture.show(<ChecklistDetailScreen />); await screen.findByRole('button', { name: strings.checklists.archive }); fireEvent.press(screen.getByRole('button', { name: strings.checklists.archive }));
  expect(fetcher.mock.calls.some((call) => call[1]?.method === 'DELETE')).toBe(false); fireEvent.press(screen.getByRole('button', { name: strings.checklists.confirmArchive })); await screen.findByText(strings.checklists.archivedLabel);
  expect(screen.queryByRole('button', { name: strings.checklists.startToday })).toBeNull();
  expect(screen.queryByLabelText(strings.checklists.date)).toBeNull();
  expect(screen.getByRole('button', { name: strings.checklists.history })).toBeTruthy();
});
