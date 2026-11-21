import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { guidelineSchema, guidelineVersionSchema } from '@gabinete-plus/shared';
import { dashboardFixture } from '../dashboard/fixtures.test-helper';
import { GuidelineDetailScreen, GuidelineForm, GuidelineFormScreen, GuidelineHistoryScreen, GuidelineListScreen, GuidelineVersionScreen } from './screens';
import { MarkdownContent } from '../../components/markdown-content';
import { strings } from '../../lib/strings';
const mockReplace = jest.fn(); const mockPush = jest.fn();
let mockVersion: string | undefined;
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }), useLocalSearchParams: () => ({ id: 'guide-1', version: mockVersion }) }));
jest.mock('@shopify/flash-list', () => { const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native'); return { FlashList: FlatList }; });
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
const guide = guidelineSchema.parse({ id: 'guide-1', title: 'Orientação fictícia', category: 'SESSOES', content: '# Preparação\n\nTexto original.', essentialForTransition: true, isArchived: false, version: 3, createdById: 'actor', updatedById: 'actor', authorName: 'Autora fictícia', createdAt: '2026-10-12T12:00:00Z', updatedAt: '2026-10-12T12:00:00Z' });
const previousVersion = guidelineVersionSchema.parse({ ...guide, id: 'version-2', guidelineId: guide.id, authorId: 'actor', version: 2, content: 'Texto preservado fictício.' });
let fixture: Awaited<ReturnType<typeof dashboardFixture>>; let fetcher: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>; let previous: string | undefined;
beforeEach(async () => { jest.useFakeTimers(); previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; fixture = await dashboardFixture(); fetcher = jest.spyOn(globalThis, 'fetch'); mockReplace.mockClear(); mockPush.mockClear(); });
afterEach(() => { cleanup(); fixture.client.clear(); act(() => jest.runOnlyPendingTimers()); jest.useRealTimers(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
function chief() { const user = fixture.manager.store.getState().user; if (!user) throw new Error('Usuário ausente.'); fixture.manager.store.setState({ user: { ...user, role: 'CHEFE' } }); }
it('lista orientação essencial com resumo, versão, data e autor sem consultar detalhes', async () => {
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...guide, content: '# Preparação\n\nLeia **as instruções** e [o fluxo](https://example.invalid).' }], nextCursor: null })));
  fixture.show(<GuidelineListScreen />);
  const row = await screen.findByRole('button', { name: strings.guidelines.essentialRecord(guide.title) });
  expect(screen.getByText('Preparação Leia as instruções e o fluxo.').props.numberOfLines).toBe(2);
  expect(screen.getByText(strings.guidelines.listMetadata(strings.guidelines.version(3), '12/10/2026', guide.authorName))).toBeTruthy();
  expect(screen.queryByRole('button', { name: strings.guidelines.create })).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
  fireEvent.press(row);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/orientacao/[id]', params: { id: guide.id } });
});
it('busca com categoria e disponibiliza arquivadas e cadastro à chefia no painel', async () => {
  chief();
  fetcher.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ items: [], nextCursor: null }))));
  fixture.show(<GuidelineListScreen pane />);
  await screen.findByText(strings.guidelines.empty);
  fireEvent.changeText(screen.getByLabelText(strings.guidelines.search), ' sessão ');
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.searchAction }));
  fireEvent.press(screen.getByRole('togglebutton', { name: strings.guidelines.categories.SESSOES }));
  fireEvent.press(screen.getByRole('togglebutton', { name: strings.contacts.archived }));
  await waitFor(() => {
    const params = new URL(String(fetcher.mock.calls.at(-1)?.[0])).searchParams;
    expect(params.get('q')).toBe('sessão');
    expect(params.get('category')).toBe('SESSOES');
    expect(params.get('isArchived')).toBe('true');
  });
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.createShort }));
  expect(mockPush).toHaveBeenCalledWith('/orientacao/nova');
});
it('consulta exibe Markdown, autor e versão sem manutenção para assessor', async () => { fetcher.mockResolvedValue(new Response(JSON.stringify(guide))); fixture.show(<GuidelineDetailScreen />); await screen.findByText('Preparação'); expect(screen.getByText(strings.guidelines.version(3), { exact: false })).toBeTruthy(); expect(screen.queryByRole('button', { name: strings.guidelines.edit })).toBeNull(); });
it('arquivamento pede confirmação e mantém a orientação disponível para consulta', async () => {
  chief();
  let archived = false;
  fetcher.mockImplementation((_url, init) => {
    if (init?.method === 'DELETE') { archived = true; return Promise.resolve(new Response(null, { status: 204 })); }
    return Promise.resolve(new Response(JSON.stringify({ ...guide, isArchived: archived })));
  });
  fixture.show(<GuidelineDetailScreen />);
  fireEvent.press(await screen.findByRole('button', { name: strings.guidelines.moreActions }));
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.archive }));
  expect(screen.getByText(strings.guidelines.archiveHelp)).toBeTruthy();
  expect(archived).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.confirmArchive }));
  await screen.findByText(strings.guidelines.archived);
  expect(screen.queryByRole('button', { name: strings.guidelines.moreActions })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.history }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/orientacao/[id]/versoes', params: { id: guide.id } });
});
it('rota direta de cadastro não concede manutenção ao assessor', () => { fixture.show(<GuidelineFormScreen mode="create" />); expect(screen.getByText(strings.guidelines.forbidden)).toBeTruthy(); expect(fetcher).not.toHaveBeenCalled(); });
it('edição mantém o rascunho ao fechar o conflito e envia a versão original', async () => {
  chief();
  fetcher.mockResolvedValue(new Response(JSON.stringify({ error: { code: 'GUIDELINE_VERSION_CONFLICT', message: 'Conflito' } }), { status: 409 }));
  fixture.show(<GuidelineForm guideline={guide} />);
  fireEvent.changeText(screen.getByLabelText(strings.guidelines.name), 'Rascunho preservado');
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await screen.findByRole('header', { name: strings.guidelines.conflictTitle });
  expect(screen.getByRole('button', { name: strings.guidelines.reopen })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: strings.routines.continueEditing }));
  expect(screen.getByLabelText(strings.guidelines.name).props.value).toBe('Rascunho preservado');
  expect(fetcher.mock.calls[0]?.[1]?.body).toContain('"expectedVersion":3');
  expect(mockReplace).not.toHaveBeenCalled();
});
it('pré-visualização e seleção de categoria preservam o texto do editor', async () => {
  chief();
  fixture.show(<GuidelineForm />);
  fireEvent.press(screen.getByRole('tab', { name: strings.guidelines.preview }));
  expect(screen.getByText(strings.guidelines.emptyContent)).toBeTruthy();
  fireEvent.press(screen.getByRole('tab', { name: strings.guidelines.write }));
  fireEvent.changeText(screen.getByLabelText(strings.guidelines.content), '## Prévia fictícia');
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.category }));
  fireEvent.press(screen.getByRole('radio', { name: strings.guidelines.categories.PRAZOS }));
  fireEvent.press(screen.getByRole('tab', { name: strings.guidelines.preview }));
  expect(screen.getByText('Prévia fictícia')).toBeTruthy();
  fireEvent.press(screen.getByRole('tab', { name: strings.guidelines.write }));
  expect(screen.getByLabelText(strings.guidelines.content).props.value).toBe('## Prévia fictícia');
  expect(screen.getByRole('button', { name: strings.guidelines.category }).props.accessibilityValue.text).toBe(strings.guidelines.categories.PRAZOS);
  fireEvent.press(screen.getByRole('button', { name: strings.routines.cancel }));
  await screen.findByRole('header', { name: strings.routines.unsavedTitle });
  expect(mockReplace).not.toHaveBeenCalled();
});
it('cadastro valida e só navega após sucesso', async () => { chief(); fetcher.mockResolvedValue(new Response(JSON.stringify(guide))); fixture.show(<GuidelineForm />); fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await screen.findByText(strings.guidelines.validation.title); expect(fetcher).not.toHaveBeenCalled(); fireEvent.changeText(screen.getByLabelText(strings.guidelines.name), 'Nova orientação'); fireEvent.changeText(screen.getByLabelText(strings.guidelines.content), 'Conteúdo fictício'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await waitFor(() => expect(mockReplace).toHaveBeenCalled()); });
it('Markdown não carrega imagens remotas nem executa HTML', () => { const rendered = fixture.show(<MarkdownContent content={'![imagem](https://example.invalid/tracker.png)\n\n<script>alert(1)</script>'} />); expect(screen.getByText(strings.guidelines.mediaNotice)).toBeTruthy(); expect(rendered.toJSON()).toBeTruthy(); expect(fetcher).not.toHaveBeenCalled(); });
it('histórico indica a versão atual e abre a versão solicitada', async () => {
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...previousVersion, id: 'version-3', version: 3 }, previousVersion], nextCursor: null })));
  fixture.show(<GuidelineHistoryScreen />);
  expect(await screen.findByRole('button', { name: strings.guidelines.currentVersionLabel(strings.guidelines.version(3)) })).toBeTruthy();
  expect(screen.getAllByText(strings.guidelines.historyMetadata('12/10/2026', '09:00', guide.authorName))).toHaveLength(2);
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.version(2) }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/orientacao/[id]/versao/[version]', params: { id: guide.id, version: '2' } });
});
it('versão preservada permanece em leitura e indica a vigente mesmo arquivada', async () => {
  mockVersion = '2';
  fetcher.mockImplementation((url) => Promise.resolve(new Response(JSON.stringify(
    String(url).endsWith('/versions/2') ? previousVersion : { ...guide, isArchived: true },
  ))));
  fixture.show(<GuidelineVersionScreen />);
  await screen.findByText(strings.guidelines.previousVersion('12/10/2026', 3));
  expect(screen.getByText(previousVersion.content)).toBeTruthy();
  expect(screen.queryByRole('button', { name: strings.guidelines.edit })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: strings.guidelines.openCurrent }));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/orientacao/[id]', params: { id: guide.id } });
  mockVersion = undefined;
});
