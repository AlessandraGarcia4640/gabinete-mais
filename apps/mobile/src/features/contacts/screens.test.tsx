import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { canOpenURL, openURL } from 'expo-linking';
import { dashboardFixture } from '../dashboard/fixtures.test-helper';
import { contactFixture } from './fixtures.test-helper';
import { ContactDetailScreen, ContactFormScreen, ContactListScreen } from './screens';
import { ContactForm } from './form';
import { strings } from '../../lib/strings';
import { updateContactSchema } from '@gabinete-plus/shared';
const mockPush = jest.fn(); const mockReplace = jest.fn(); let mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace, canGoBack: () => false }), useLocalSearchParams: () => mockParams }));
jest.mock('expo-linking', () => ({ canOpenURL: jest.fn(), openURL: jest.fn() }));
jest.mock('@shopify/flash-list', () => { const { FlatList } = jest.requireActual<typeof import('react-native')>('react-native'); return { FlashList: FlatList }; });
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
let fixture: Awaited<ReturnType<typeof dashboardFixture>>; let fetcher: jest.SpyInstance<ReturnType<typeof fetch>, Parameters<typeof fetch>>; let previous: string | undefined;
beforeEach(async () => { jest.useFakeTimers(); previous = process.env.EXPO_PUBLIC_API_URL; process.env.EXPO_PUBLIC_API_URL = 'https://api.example.invalid'; fixture = await dashboardFixture(); fetcher = jest.spyOn(globalThis, 'fetch'); mockParams = {}; mockPush.mockClear(); mockReplace.mockClear(); jest.mocked(canOpenURL).mockReset().mockResolvedValue(false); jest.mocked(openURL).mockReset().mockResolvedValue(true); });
afterEach(() => { cleanup(); fixture.client.clear(); act(() => jest.runOnlyPendingTimers()); jest.useRealTimers(); fetcher.mockRestore(); if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = previous; });
function chief() { const user = fixture.manager.store.getState().user; if (!user) throw new Error('Usuário ausente.'); fixture.manager.store.setState({ user: { ...user, role: 'CHEFE' } }); }
function response(value: object) { return Promise.resolve(new Response(JSON.stringify(value))); }
it('consulta pagina por cursor e abre detalhes sem manutenção para assessor', async () => {
  fetcher.mockImplementation((url) => response({ items: [contactFixture({ id: String(url).includes('cursor=') ? 'contact-2' : 'contact-1', name: String(url).includes('cursor=') ? 'Suporte Fictício' : 'Secretaria Fictícia' })], nextCursor: String(url).includes('cursor=') ? null : 'contact-1' }));
  fixture.show(<ContactListScreen />); await screen.findByRole('button', { name: strings.contacts.keyRecord('Secretaria Fictícia') }); expect(screen.queryByRole('button', { name: strings.contacts.create })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore })); await screen.findByRole('button', { name: strings.contacts.keyRecord('Suporte Fictício') }); expect(fetcher.mock.calls.some((call) => String(call[0]).includes('cursor=contact-1'))).toBe(true);
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.keyRecord('Secretaria Fictícia') })); expect(mockPush).toHaveBeenCalledWith({ pathname: '/contato/[id]', params: { id: 'contact-1' } });
});
it('filtros são enviados ao servidor e limpar volta ao catálogo ativo', async () => {
  fetcher.mockImplementation(() => response({ items: [], nextCursor: null })); fixture.show(<ContactListScreen />); await screen.findByText(strings.contacts.empty);
  fireEvent.changeText(screen.getByLabelText(strings.contacts.search), ' secretaria ');
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.filterLabel }));
  fireEvent.changeText(screen.getByLabelText(strings.contacts.filterOrganization), 'Tribunal');
  fireEvent.changeText(screen.getByLabelText(strings.contacts.filterTag), 'URGENTE');
  expect(fetcher).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.applyFilters }));
  fireEvent.press(screen.getByRole('togglebutton', { name: strings.contacts.archived }));
  fireEvent.press(screen.getByRole('togglebutton', { name: strings.contacts.keyOnly }));
  await waitFor(() => { const url = new URL(String(fetcher.mock.calls.at(-1)?.[0])); expect(url.searchParams.get('q')).toBe('secretaria'); expect(url.searchParams.get('organization')).toBe('Tribunal'); expect(url.searchParams.get('tag')).toBe('urgente'); expect(url.searchParams.get('isArchived')).toBe('true'); expect(url.searchParams.get('isKeyContact')).toBe('true'); });
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.activeFilters(2) }));
  expect(screen.getByLabelText(strings.contacts.filterTag).props.value).toBe('URGENTE');
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.clearFilters }));
  await screen.findByText(strings.contacts.empty);
  expect(screen.getByLabelText(strings.contacts.search).props.value).toBe('');
  expect(screen.getByRole('togglebutton', { name: strings.contacts.all }).props.accessibilityState.checked).toBe(true);
});
it('falha inicial permite tentar novamente e falha na próxima página preserva registros', async () => {
  fetcher.mockRejectedValue(new Error('offline')); fixture.show(<ContactListScreen />); await screen.findByText(strings.feedback.error);
  fetcher.mockImplementation((url) => String(url).includes('cursor=') ? Promise.reject(new Error('offline')) : response({ items: [contactFixture()], nextCursor: 'contact-1' }));
  fireEvent.press(screen.getByRole('button', { name: strings.feedback.retry })); await screen.findByText('Secretaria Fictícia'); fireEvent.press(screen.getByRole('button', { name: strings.feedback.loadMore }));
  await screen.findByText(strings.feedback.updatingError); expect(screen.getByRole('button', { name: strings.contacts.keyRecord('Secretaria Fictícia') })).toBeTruthy();
});
it('detalhes exibem canais, etiquetas e observações; consulta não oferece edição', async () => {
  mockParams = { id: 'contact-1' }; fetcher.mockImplementation(() => response(contactFixture())); fixture.show(<ContactDetailScreen />);
  await screen.findByText('(51) 3333-4444 ramal 12'); expect(screen.getByText('secretaria@example.invalid')).toBeTruthy(); expect(screen.getByText('Contato fictício\nOrientação de atendimento.')).toBeTruthy(); expect(screen.queryByRole('button', { name: strings.contacts.edit })).toBeNull();
  expect(screen.queryByRole('button', { name: strings.contacts.call })).toBeNull();
  expect(screen.getByText('(51) 3333-4444 ramal 12').props.selectable).toBe(true);
});
it('ações consultam os esquemas suportados e preservam o telefone original na ficha', async () => {
  mockParams = { id: 'contact-1' };
  const contact = contactFixture({ phones: ['+1 (202) 555-0104 ramal 12', '+1 (202) 555-0105'] });
  const first = 'tel:+12025550104;ext=12';
  fetcher.mockImplementation(() => response(contact));
  jest.mocked(canOpenURL).mockImplementation(async (url) => url !== 'tel:+12025550105');
  fixture.show(<ContactDetailScreen />);
  fireEvent.press(await screen.findByRole('button', { name: strings.contacts.call }));
  expect(openURL).toHaveBeenLastCalledWith(first);
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.callPhone(contact.phones[0] ?? '') }));
  expect(openURL).toHaveBeenLastCalledWith(first);
  expect(screen.queryByRole('button', { name: strings.contacts.callPhone(contact.phones[1] ?? '') })).toBeNull();
  expect(screen.getByText('+1 (202) 555-0105').props.selectable).toBe(true);
  jest.mocked(openURL).mockRejectedValueOnce(new Error('Canal fictício indisponível.'));
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.writeEmail('secretaria@example.invalid') }));
  expect(openURL).toHaveBeenLastCalledWith('mailto:secretaria@example.invalid');
  await screen.findByText(strings.contacts.linkUnavailable);
});
it('link direto não concede manutenção ao assessor', () => {
  fixture.show(<ContactFormScreen mode="create" />); expect(screen.getByText(strings.contacts.forbidden)).toBeTruthy(); expect(fetcher).not.toHaveBeenCalled();
});
it('identificador inválido não faz chamadas indevidas', () => {
  fixture.show(<ContactDetailScreen />); expect(screen.getByText(strings.contacts.notFound)).toBeTruthy(); expect(fetcher).not.toHaveBeenCalled();
});
it('formulário valida obrigatórios, cria telefones e etiquetas e preserva campos após falha', async () => {
  chief(); const saved = jest.fn(); fetcher.mockRejectedValue(new Error('offline')); fixture.show(<ContactForm onSaved={saved} onCancel={() => undefined} />); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await screen.findByText(strings.contacts.validation.name); expect(fetcher).not.toHaveBeenCalled(); fireEvent.changeText(screen.getByLabelText(strings.contacts.name), 'Contato novo'); fireEvent.changeText(screen.getByLabelText(strings.contacts.organization), 'Tribunal');
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.addPhone })); fireEvent.changeText(screen.getByLabelText(strings.contacts.phone(0)), '(51) 3333-4444');
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.addTag }));
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.confirmTag }));
  expect(screen.getByText(strings.contacts.validation.tags)).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText(strings.contacts.tag(0)), ' SECRETARIA ');
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.confirmTag }));
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await screen.findByText(strings.auth.network); expect(screen.getByLabelText(strings.contacts.name).props.value).toBe('Contato novo');
  fetcher.mockImplementation(() => response(contactFixture())); fireEvent.press(screen.getByRole('button', { name: strings.routines.save })); await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(fetcher.mock.calls.at(-1)?.[1]?.body).toContain('"tags":["secretaria"]');
});
it('edição remove telefone e limpa e-mail enviando somente mudanças', async () => {
  chief(); const saved = jest.fn(); const contact = contactFixture(); fetcher.mockImplementation(() => response({ ...contact, phones: [], email: null })); fixture.show(<ContactForm contact={contact} onSaved={saved} onCancel={() => undefined} />);
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.removePhone(0) })); fireEvent.changeText(screen.getByLabelText(strings.contacts.email), ''); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await waitFor(() => expect(saved).toHaveBeenCalled()); expect(fetcher.mock.calls[0]?.[1]?.method).toBe('PATCH'); expect(updateContactSchema.parse(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)))).toEqual({ email: null, phones: [] });
});
it('edição altera e remove etiquetas sem modificar outros campos', async () => {
  chief();
  const saved = jest.fn();
  const contact = contactFixture({ tags: ['agenda', 'plantao'] });
  fetcher.mockImplementation(() => response({ ...contact, tags: ['plantao especial'] }));
  fixture.show(<ContactForm contact={contact} onSaved={saved} onCancel={() => undefined} />);
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.editTag('plantao') }));
  fireEvent.changeText(screen.getByLabelText(strings.contacts.tag(1)), 'PLANTAO ESPECIAL');
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.confirmTag }));
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.removeNamedTag('agenda') }));
  fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(updateContactSchema.parse(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)))).toEqual({ tags: ['plantao especial'] });
});
it('cancelar campos alterados exige descarte explícito', async () => {
  chief(); const cancel = jest.fn(); fixture.show(<ContactForm onSaved={() => undefined} onCancel={cancel} />); fireEvent.changeText(screen.getByLabelText(strings.contacts.name), 'Rascunho');
  fireEvent.press(screen.getByRole('button', { name: strings.routines.cancel })); expect(screen.getByRole('header', { name: strings.routines.unsavedTitle })).toBeTruthy(); expect(cancel).not.toHaveBeenCalled(); fireEvent.press(screen.getByRole('button', { name: strings.routines.discard })); expect(cancel).toHaveBeenCalledTimes(1);
});
it('arquivamento exige confirmação e contato arquivado permanece consultável', async () => {
  chief(); mockParams = { id: 'contact-1' }; let archived = false; fetcher.mockImplementation((_url, init) => { if (init?.method === 'DELETE') { archived = true; return Promise.resolve(new Response(null, { status: 204 })); } return response(contactFixture({ isArchived: archived })); });
  fixture.show(<ContactDetailScreen />); await screen.findByRole('button', { name: strings.contacts.archive }); fireEvent.press(screen.getByRole('button', { name: strings.contacts.archive })); expect(fetcher.mock.calls.some((call) => call[1]?.method === 'DELETE')).toBe(false);
  fireEvent.press(screen.getByRole('button', { name: strings.contacts.confirmArchive })); await screen.findByText(strings.contacts.archivedLabel); expect(screen.getByText('secretaria@example.invalid')).toBeTruthy(); expect(screen.queryByRole('button', { name: strings.contacts.edit })).toBeNull();
});
it('resposta de cadastro após logout não navega nem repovoa cache', async () => {
  chief(); const saved = jest.fn(); let finish: ((value: Response) => void) | undefined; fetcher.mockImplementation(() => new Promise<Response>((resolve) => { finish = resolve; }));
  fixture.show(<ContactForm onSaved={saved} onCancel={() => undefined} />); fireEvent.changeText(screen.getByLabelText(strings.contacts.name), 'Contato'); fireEvent.changeText(screen.getByLabelText(strings.contacts.organization), 'Tribunal'); fireEvent.press(screen.getByRole('button', { name: strings.routines.save }));
  await waitFor(() => expect(fetcher).toHaveBeenCalled()); await act(async () => { cleanup(); await fixture.manager.logout(); if (!finish) throw new Error('Requisição ausente.'); finish(new Response(JSON.stringify(contactFixture()))); });
  expect(saved).not.toHaveBeenCalled(); expect(fixture.client.getQueryData(['contact', 'contact-1', 'actor'])).toBeUndefined();
});
