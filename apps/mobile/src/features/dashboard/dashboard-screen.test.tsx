import { act, cleanup, fireEvent, screen } from '@testing-library/react-native';
import { DashboardScreen } from './dashboard-screen';
import { dashboardFixture, routineFixture, taskFixture } from './fixtures.test-helper';
import { strings } from '../../lib/strings';
import type { Href } from 'expo-router';
import type { ReactElement } from 'react';
import { cloneElement as mockCloneElement } from 'react';
import { gabineteDate } from './model';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ href, children }: { href: Href; children: ReactElement<{ onPress: () => void }> }) =>
    mockCloneElement(children, { onPress: () => mockPush(href) }),
}));
jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default;
});
let fixture: Awaited<ReturnType<typeof dashboardFixture>>;
let fetcher: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
let previous: string | undefined;
const json = (value: object, status = 200) => Promise.resolve(new Response(JSON.stringify(value), { status }));
beforeEach(async () => {
  previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; fixture = await dashboardFixture(); mockPush.mockClear();
  fetcher = jest.spyOn(globalThis, 'fetch');
});
afterEach(() => { cleanup(); fixture.client.clear(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
it('exibe tarefas e rotinas reais do transporte e abre as listagens', async () => {
  fetcher.mockImplementation((url) => { const parsed = new URL(String(url));
    if (parsed.pathname === '/routines') return json({ items: [routineFixture()], nextCursor: null });
    return json({ items: parsed.searchParams.get('status') === 'ABERTA' ? [taskFixture({ dueDate: '2000-01-01', isOverdue: true })] : [], nextCursor: null });
  });
  fixture.show(<DashboardScreen />); await screen.findByText('Tarefa fictícia'); await screen.findByText('Rotina fictícia'); expect(screen.getByText(strings.dashboard.overdue)).toBeTruthy();
  expect(screen.getByRole('header', { name: strings.dashboard.greeting('Pessoa') })).toBeTruthy();
  expect(screen.getByText(strings.dashboard.routineSummary('Diária', 'Administrativo'))).toBeTruthy();
  const urls = fetcher.mock.calls.map((call) => new URL(String(call[0]))); expect(urls.filter((url) => url.pathname === '/tasks').every((url) => url.searchParams.get('assigneeId') === 'actor' && url.searchParams.get('limit') === '5')).toBe(true);
  expect(urls.find((url) => url.pathname === '/routines')?.searchParams.get('scheduledFor')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  for (const [label, path] of [[strings.dashboard.viewTasks, '/tarefas'], [strings.dashboard.viewRoutines, '/rotinas']]) {
    fireEvent.press(screen.getByRole('link', { name: label })); expect(mockPush).toHaveBeenLastCalledWith(path === '/rotinas' ? { pathname: '/rotinas', params: { scope: 'today' } } : path);
  }
  fireEvent.press(screen.getByRole('button', { name: 'Rotina fictícia' }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/rotina/[id]', params: { id: 'routine-1' } });
  fireEvent.press(screen.getByRole('button', { name: strings.tasks.create }));
  expect(mockPush).toHaveBeenLastCalledWith('/tarefa/nova');
});
it('identifica prazo de hoje e checklist vinculado sem repetir o responsável', async () => {
  const today = gabineteDate();
  fetcher.mockImplementation((url) => json({
    items: new URL(String(url)).searchParams.get('status') === 'ABERTA'
      ? [taskFixture({ dueDate: today, checklistRunId: 'execucao-ficticia' })]
      : [],
    nextCursor: null,
  }));
  fixture.show(<DashboardScreen />);
  await screen.findByText(strings.tasks.run);
  expect(screen.getByText(strings.dashboard.dueToday(`${today.slice(8)}/${today.slice(5, 7)}`))).toBeTruthy();
  expect(screen.queryByText('Pessoa Fictícia')).toBeNull();
});
it('estado vazio não é mostrado enquanto tarefas ainda carregam', async () => {
  let finish: (response: Response) => void = () => { throw new Error('Promise ausente.'); };
  fetcher.mockImplementation((url) => { const parsed = new URL(String(url));
    return parsed.searchParams.get('status') === 'ABERTA' ? new Promise((resolve) => { finish = resolve; }) : json({ items: [], nextCursor: null });
  });
  fixture.show(<DashboardScreen />); expect(screen.queryByText(strings.dashboard.emptyTasks)).toBeNull(); await screen.findByText(strings.dashboard.emptyRoutines);
  expect(screen.getByText(strings.feedback.loading)).toBeTruthy(); await act(async () => { finish(new Response(JSON.stringify({ items: [], nextCursor: null }))); });
  await screen.findByText(strings.dashboard.emptyTasks);
});
it('falha de uma seção não apaga a outra e a tentativa manual recupera tarefas', async () => {
  let fail = true;
  fetcher.mockImplementation((url) => { const parsed = new URL(String(url));
    if (parsed.pathname === '/routines') return json({ items: [routineFixture()], nextCursor: null });
    if (parsed.searchParams.get('status') === 'ABERTA') return fail ? json({ error: { code: 'INTERNAL_ERROR', message: 'Interno' } }, 503) : json({ items: [taskFixture()], nextCursor: null });
    return json({ items: [], nextCursor: null });
  });
  fixture.show(<DashboardScreen />); await screen.findByText(strings.feedback.error); expect(screen.getByText('Rotina fictícia')).toBeTruthy(); expect(screen.queryByText(strings.dashboard.emptyTasks)).toBeNull();
  fail = false; fireEvent.press(screen.getByRole('button', { name: strings.feedback.retry })); await screen.findByText('Tarefa fictícia');
});
