# Biblioteca de componentes do Gabinete+

Importe os componentes de `src/components/index.ts`. Acesse `ListGroupItem`, `DiscardDialog` e `SplitView` nos respectivos módulos. Consultas, rotas, estado dos formulários e permissões pertencem às features.

| Componentes | Uso |
| --- | --- |
| `AppText`, `Icon` | Tipografia e ícones Feather. Forneça rótulo acessível quando o ícone comunicar algo sozinho. |
| `Button`, `IconButton`, `Fab` | Ações com nome acessível. Use `danger` na confirmação e `dangerGhost` na ação que abre o diálogo. `loading` bloqueia reenvio. |
| `TextField`, `SearchField`, `SelectField` | Campos controlados. O erro do formulário aparece abaixo do campo. `SelectField` abre uma folha pelo callback. |
| `Chip`, `ChipGroup`, `Choice`, `SegmentedControl` | Filtros e seleções controlados pela tela. Use o modo rádio para escolhas exclusivas e controles segmentados para alternar visões. |
| `Checkbox`, `Switch` | Marcação de item e opção binária. Ambos enviam o próximo valor ao chamador. |
| `Card`, `KeyValueList`, `TaskCard` | Superfícies, pares rótulo–valor e resumo de tarefa. Cards interativos exigem rótulo e ação. |
| `ListGroup`, `ListRow`, `Avatar` | Linhas agrupadas, itens informativos ou navegáveis e iniciais. Ofereça o nome da pessoa em texto junto ao avatar. Use `ListGroupItem` no renderizador de listas virtualizadas. |
| `StatusBadge`, `PriorityTag`, `Tag`, `ProgressBar` | Estado com palavra e ícone, prioridade, etiqueta de versão e avanço com fração. |
| `Banner`, `Toast` | Faixas de contexto, alertas e confirmação. A tela decide quando exibir a confirmação. |
| `LoadingState`, `EmptyState`, `ErrorState`, `Skeleton` | Estados de consulta. `ErrorState` recebe o comando explícito de tentar novamente. |
| `Dialog`, `Sheet`, `DiscardDialog` | Confirmações, seleções e descarte de formulário. Passe o gatilho em `returnFocusRef` para devolver o foco no dispositivo. Em telas largas, a folha é exibida lateralmente. |
| `Screen`, `AuthScreen`, `AppBar`, `LargeHeader`, `FooterBar`, `Section`, `Overline`, `SplitView` | Estrutura das telas. Use `Screen keyboard` nos formulários, `AuthScreen` no acesso e `SplitView` nas rotas com lista e leitura simultâneas. |
| `Timeline`, `MarkdownContent`, `OrderedEditor` | Histórico, leitura de orientações e edição de linhas ordenadas. |

Centralize os textos em `src/lib/strings.ts`. Use `useTheme()` para as cores do tema ativo e os tokens de `src/lib/theme.ts` para tipografia, dimensões e pontos de quebra. A feature controla a paginação e fornece os itens ao FlashList. Conserve os itens já carregados quando a atualização falhar.

Os testes em `components.test.tsx` e `accessibility.test.tsx` cobrem interação, foco, papéis e estados acessíveis. `src/lib/contrast.test.ts` verifica cores nos dois temas. As verificações no Chrome cobriram 390, 834 e 1360 px. Consulte [Acessibilidade do app](../../../../docs/acessibilidade.md) para os resultados e as verificações em aberto.
