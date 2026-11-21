import { useState } from 'react';
import { KeyboardAvoidingView, Text, View } from 'react-native';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import {
  AppBar, AuthScreen, Avatar, Banner, Button, Card, Checkbox, Chip, ChipGroup, Choice, Dialog,
  EmptyState, ErrorState, Fab, FooterBar, Icon, IconButton, KeyValueList, LargeHeader, ListGroup,
  ListRow, LoadingState, MarkdownContent, OrderedEditor, PriorityTag, ProgressBar, Screen,
  SearchField, Section, SegmentedControl, SelectField, Sheet, Skeleton, StatusBadge, Switch, Tag,
  TaskCard, TextField, Timeline, Toast,
} from './index';
import { strings } from '../lib/strings';
jest.mock('react-native-safe-area-context', () => { const mock = jest.requireActual<typeof import('react-native-safe-area-context/jest/mock')>('react-native-safe-area-context/jest/mock'); return mock.default; });
afterEach(cleanup);
it('botão bloqueia novos comandos durante carga e quando desabilitado', () => {
  const action = jest.fn(); const result = render(<Button label="Salvar fictício" onPress={action} loading />);
  expect(screen.getByRole('button').props.accessibilityState).toEqual({ busy: true, disabled: true }); fireEvent.press(screen.getByRole('button')); expect(action).not.toHaveBeenCalled();
  result.rerender(<Button label="Salvar fictício" onPress={action} disabled variant="secondary" />); fireEvent.press(screen.getByRole('button')); expect(action).not.toHaveBeenCalled();
  result.rerender(<Button label="Salvar fictício" onPress={action} />); fireEvent.press(screen.getByRole('button')); expect(action).toHaveBeenCalledTimes(1);
});
it('campo conserva atributos nativos, estilo e erro acessível', () => {
  const change = jest.fn(); render(<TextField label="Campo fictício" value="Texto" multiline editable={false} secureTextEntry style={{ minHeight: 80 }} errorText="Erro fictício" onChangeText={change} />);
  const input = screen.getByLabelText('Campo fictício'); expect(input.props.multiline).toBe(true); expect(input.props.editable).toBe(false); expect(input.props.secureTextEntry).toBe(true);
  expect(input).toHaveStyle({ minHeight: 80 }); expect(input.props.accessibilityHint).toBe('Erro fictício'); expect(screen.getByText('Erro fictício')).toBeTruthy();
});
it('campo controlado encaminha digitação sem manter valor próprio', () => {
  function Example() { const [value, setValue] = useState(''); return <TextField label="Nome fictício" value={value} onChangeText={setValue} />; }
  render(<Example />); fireEvent.changeText(screen.getByLabelText('Nome fictício'), 'Novo nome'); expect(screen.getByLabelText('Nome fictício').props.value).toBe('Novo nome');
});
it('card estático não cria ação e card interativo tem nome e executa uma ação', () => {
  const action = jest.fn(); const result = render(<Card><Text>Registro fictício</Text></Card>); expect(screen.queryByRole('button')).toBeNull();
  result.rerender(<Card label="Abrir registro" onPress={action}><Text>Registro fictício</Text></Card>); fireEvent.press(screen.getByRole('button', { name: 'Abrir registro' })); expect(action).toHaveBeenCalledTimes(1);
});
it('escolha reflete seleção e impede ação desabilitada', () => {
  const action = jest.fn(); const result = render(<Choice label="Opção fictícia" selected onPress={action} disabled />);
  expect(screen.getByRole('radio').props.accessibilityState).toEqual({ checked: true, disabled: true }); fireEvent.press(screen.getByRole('radio')); expect(action).not.toHaveBeenCalled();
  result.rerender(<Choice label="Opção fictícia" selected={false} onPress={action} />); fireEvent.press(screen.getByRole('radio')); expect(action).toHaveBeenCalledTimes(1);
});
it('checkbox comunica o próximo estado e bloqueia ação desabilitada', () => {
  const action = jest.fn(); const result = render(<Checkbox label="Item fictício" checked={false} onChange={action} />); fireEvent.press(screen.getByRole('checkbox')); expect(action).toHaveBeenLastCalledWith(true);
  result.rerender(<Checkbox label="Item fictício" checked onChange={action} />); fireEvent.press(screen.getByRole('checkbox')); expect(action).toHaveBeenLastCalledWith(false);
  result.rerender(<Checkbox label="Item fictício" checked onChange={action} disabled />); fireEvent.press(screen.getByRole('checkbox')); expect(action).toHaveBeenCalledTimes(2);
});
it('feedback oferece estado vazio, carga customizada e recuperação manual', () => {
  const retry = jest.fn(); const result = render(<View><LoadingState message="Carregando registros fictícios" /></View>); expect(screen.getByText('Carregando registros fictícios')).toBeTruthy();
  result.rerender(<View><EmptyState message="Sem registros fictícios" /></View>); expect(screen.getByText('Sem registros fictícios')).toBeTruthy(); expect(screen.queryByRole('button')).toBeNull();
  result.rerender(<View><ErrorState retry={retry} updating /></View>); expect(screen.getByRole('alert')).toHaveTextContent(strings.feedback.updatingError); fireEvent.press(screen.getByRole('button', { name: strings.feedback.retry })); expect(retry).toHaveBeenCalledTimes(1);
});
it('mensagem de erro específica substitui a mensagem padrão', () => {
  render(<ErrorState message="Falha fictícia conhecida" retry={() => undefined} />); expect(screen.getByRole('alert')).toHaveTextContent('Falha fictícia conhecida'); expect(screen.queryByText(strings.feedback.error)).toBeNull();
});
it('Screen mantém conteúdo e ativa tratamento de teclado somente quando solicitado', () => {
  const result = render(<Screen><Text>Conteúdo fictício</Text></Screen>); expect(screen.getByText('Conteúdo fictício')).toBeTruthy(); expect(result.UNSAFE_queryByType(KeyboardAvoidingView)).toBeNull();
  result.rerender(<Screen keyboard><Text>Conteúdo fictício</Text></Screen>); expect(result.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
});
it('AuthScreen compõe o contêiner comum e mantém formulário rolável', () => {
  const result = render(<AuthScreen><TextField label="Acesso fictício" value="" /></AuthScreen>); expect(screen.getByLabelText('Acesso fictício')).toBeTruthy(); expect(result.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
});

it('comandos de ícone têm nome acessível e a ação flutuante só executa quando ativada', () => {
  const action = jest.fn();
  render(<View><IconButton label="Abrir menu fictício" icon="more-horizontal" onPress={action} /><Fab label="Criar registro fictício" onPress={action} /></View>);
  fireEvent.press(screen.getByRole('button', { name: 'Abrir menu fictício' }));
  fireEvent.press(screen.getByRole('button', { name: 'Criar registro fictício' }));
  expect(action).toHaveBeenCalledTimes(2);
});

it('busca encaminha digitação e envio e seletor anuncia o valor atual', () => {
  const change = jest.fn();
  const submit = jest.fn();
  const select = jest.fn();
  render(<View>
    <SearchField label="Buscar registros fictícios" value="" onChangeText={change} onSubmit={submit} />
    <SelectField label="Categoria fictícia" value="Primeira opção" placeholder="Selecionar uma opção" onPress={select} expanded />
  </View>);
  const field = screen.getByLabelText('Buscar registros fictícios');
  fireEvent.changeText(field, 'Registro 42');
  fireEvent(field, 'submitEditing');
  expect(change).toHaveBeenCalledWith('Registro 42');
  expect(submit).toHaveBeenCalledTimes(1);
  const button = screen.getByRole('button', { name: 'Categoria fictícia' });
  expect(button).toHaveAccessibilityValue({ text: 'Primeira opção' });
  expect(button).toBeExpanded();
  fireEvent.press(button);
  expect(select).toHaveBeenCalledTimes(1);
});

it('chips e segmentos comunicam a seleção e delegam a mudança', () => {
  const choose = jest.fn();
  render(<View>
    <ChipGroup label="Filtros fictícios" selection="radio">
      <Chip label="Opção fictícia" mode="radio" selected onPress={choose} />
    </ChipGroup>
    <SegmentedControl label="Visões fictícias" options={[
      { value: 'minhas', label: 'Minhas' }, { value: 'todas', label: 'Todas' },
    ]} value="minhas" onChange={choose} />
  </View>);
  expect(screen.getByRole('radio', { name: 'Opção fictícia' })).toBeChecked();
  expect(screen.getByRole('tab', { name: 'Minhas' })).toBeSelected();
  fireEvent.press(screen.getByRole('tab', { name: 'Todas' }));
  expect(choose).toHaveBeenCalledWith('todas');
  fireEvent.press(screen.getByRole('radio', { name: 'Opção fictícia' }));
  expect(choose).toHaveBeenCalledTimes(2);
});

it('interruptor comunica o estado e encaminha o próximo valor', () => {
  const change = jest.fn();
  render(<Switch label="Opção fictícia" checked description="Ajuda fictícia" onChange={change} />);
  const option = screen.getByRole('switch', { name: 'Opção fictícia' });
  expect(option).toBeChecked();
  fireEvent.press(option);
  expect(change).toHaveBeenCalledWith(false);
});

it('listas agrupam linhas, preservam metadados e anunciam a ação disponível', () => {
  const open = jest.fn();
  render(<View>
    <ListGroup label="Grupo fictício">
      <ListRow title="Helena Duarte" start={<Avatar name="Helena Duarte" />} onPress={open} selected />
      <ListRow title="Registro informativo" description="Descrição fictícia" icon="info" />
    </ListGroup>
    <KeyValueList items={[{ label: 'Prazo fictício', value: '20/11/2026', data: true }]} />
  </View>);
  expect(screen.getByRole('header', { name: 'Grupo fictício' })).toBeTruthy();
  expect(screen.getByText('Descrição fictícia')).toBeTruthy();
  expect(screen.getByText('20/11/2026')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Registro informativo' })).toBeNull();
  const row = screen.getByRole('button', { name: 'Helena Duarte' });
  expect(row).toBeSelected();
  fireEvent.press(row);
  expect(open).toHaveBeenCalledTimes(1);
});

it('selos de status e prioridade têm texto, e progresso comunica a fração', () => {
  render(<View>
    <StatusBadge status="EM_ANDAMENTO" overdue />
    <StatusBadge status="POR_FAZER" />
    <PriorityTag priority="URGENTE" />
    <Tag label="Versão fictícia" />
    <ProgressBar completed={4} total={7} label="Conclusão fictícia" />
    <TaskCard task={{ title: 'Tarefa fictícia', status: 'ABERTA', priority: 'NORMAL', isOverdue: false }} deadline="20/11/2026" />
  </View>);
  expect(screen.getByText(strings.dashboard.overdue)).toBeTruthy();
  expect(screen.getByText(strings.checklists.status.POR_FAZER)).toBeTruthy();
  expect(screen.getByText(strings.dashboard.priority.URGENTE)).toBeTruthy();
  expect(screen.getByText('Versão fictícia')).toBeTruthy();
  expect(screen.getByText('Tarefa fictícia')).toBeTruthy();
  expect(screen.getByText('4/7')).toBeTruthy();
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, now: 4, max: 7 });
});

it('faixas e confirmações têm os papéis de anúncio esperados', () => {
  render(<View><Banner message="Falha fictícia" tone="danger" /><Toast message="Registro fictício salvo" /><Skeleton /></View>);
  expect(screen.getByRole('alert')).toHaveTextContent('Falha fictícia');
  expect(screen.getByRole('status')).toHaveTextContent('Registro fictício salvo');
});

it('diálogo nomeia as ações e bloqueia confirmação e descarte enquanto ocupado', () => {
  const confirm = jest.fn();
  const dismiss = jest.fn();
  const props = {
    title: 'Arquivar o registro fictício?', message: 'O histórico de teste será preservado.',
    confirmLabel: 'Arquivar registro', dismissLabel: 'Manter registro', onConfirm: confirm, onDismiss: dismiss,
  };
  const { rerender } = render(<Dialog {...props} visible busy />);
  fireEvent.press(screen.getByRole('button', { name: props.confirmLabel }));
  fireEvent.press(screen.getByRole('button', { name: props.dismissLabel }));
  expect(confirm).not.toHaveBeenCalled();
  expect(dismiss).not.toHaveBeenCalled();
  rerender(<Dialog {...props} visible />);
  fireEvent.press(screen.getByRole('button', { name: props.confirmLabel }));
  fireEvent.press(screen.getByRole('button', { name: props.dismissLabel }));
  expect(confirm).toHaveBeenCalledTimes(1);
  expect(dismiss).toHaveBeenCalledTimes(1);
});

it('folha mostra o conteúdo somente quando aberta e oferece fechamento', () => {
  const close = jest.fn();
  const { rerender } = render(<Sheet title="Filtros fictícios" visible={false} onDismiss={close}><Text>Conteúdo fictício</Text></Sheet>);
  expect(screen.queryByText('Conteúdo fictício')).toBeNull();
  rerender(<Sheet title="Filtros fictícios" visible onDismiss={close}><Text>Conteúdo fictício</Text></Sheet>);
  expect(screen.getByText('Conteúdo fictício')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: strings.nav.close }));
  expect(close).toHaveBeenCalledTimes(1);
});

it('cabeçalhos, seções e rodapé preservam título e navegação', () => {
  const back = jest.fn();
  render(<View>
    <AppBar title="Detalhes fictícios" onBack={back} />
    <LargeHeader title="Página fictícia" description="Descrição fictícia" />
    <Section title="Seção fictícia"><FooterBar><Button label="Salvar registro" onPress={back} /></FooterBar></Section>
  </View>);
  expect(screen.getByRole('header', { name: 'Detalhes fictícios' })).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Página fictícia' })).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Seção fictícia' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: strings.nav.back }));
  expect(back).toHaveBeenCalledTimes(1);
});

it('linha temporal apresenta autoria e editor ordenado encaminha apenas ações habilitadas', () => {
  const move = jest.fn();
  render(<View>
    <Timeline entries={[{ id: 'evento-ficticio', title: 'Registro criado', detail: 'Helena Duarte', time: '20/11/2026 08:42', icon: 'plus' }]} />
    <OrderedEditor
      position={1}
      field={<TextField label="Item fictício" value="" />}
      up={{ label: 'Mover acima', onPress: move, disabled: true }}
      down={{ label: 'Mover abaixo', onPress: move }}
      remove={{ label: 'Remover item', onPress: move }}
    />
  </View>);
  expect(screen.getByText('Helena Duarte')).toBeTruthy();
  expect(screen.getByText('20/11/2026 08:42')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Mover acima' }));
  expect(move).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Mover abaixo' }));
  expect(move).toHaveBeenCalledTimes(1);
});

it('ícone significativo tem nome e Markdown preserva a leitura sem imagens externas', () => {
  render(<View>
    <Icon name="star" accessibilityLabel="Registro fictício essencial" />
    <MarkdownContent content={'Texto fictício\n\n![Imagem fictícia](https://example.invalid/imagem.png)'} />
  </View>);
  expect(screen.getByRole('image', { name: 'Registro fictício essencial' })).toBeTruthy();
  expect(screen.getByText('Texto fictício')).toBeTruthy();
  expect(screen.getByText(strings.guidelines.mediaNotice)).toBeTruthy();
});
