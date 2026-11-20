# Biblioteca de componentes do Gabinete+

Importe pela API pública em `src/components/index.ts`. Os componentes recebem valores e callbacks da tela. Consultas, navegação, formulários e permissões pertencem às features.

| Componentes | Uso |
| --- | --- |
| `AppText`, `Icon` | Tipografia e ícones Feather. Forneça rótulo acessível quando o ícone comunicar algo sozinho. |
| `Button`, `IconButton`, `Fab` | Ações com nome acessível. Use `danger` na confirmação e `dangerGhost` na ação que abre o diálogo. `loading` bloqueia reenvio. |
| `TextField`, `SearchField`, `SelectField` | Campos controlados. O erro do formulário aparece abaixo do campo. `SelectField` abre uma folha pelo callback. |
| `Chip`, `ChipGroup`, `Choice`, `SegmentedControl` | Filtros, seleções exclusivas e alternância entre duas ou três visões. A tela controla o valor selecionado. |
| `Checkbox`, `Switch` | Marcação de item e opção binária. Ambos enviam o próximo valor ao chamador. |
| `Card`, `KeyValueList`, `TaskCard` | Superfícies, pares rótulo–valor e resumo de tarefa. Cards interativos exigem rótulo e ação. |
| `ListGroup`, `ListRow`, `Avatar` | Linhas agrupadas, itens informativos ou navegáveis e iniciais. O avatar acompanha o nome visível da pessoa. |
| `StatusBadge`, `PriorityTag`, `Tag`, `ProgressBar` | Estado com palavra e ícone, prioridade, etiqueta de versão e avanço com fração. |
| `Banner`, `Toast` | Faixas de contexto, alertas e confirmação. A tela decide quando exibir a confirmação. |
| `LoadingState`, `EmptyState`, `ErrorState`, `Skeleton` | Estados de consulta. `ErrorState` recebe o comando explícito de tentar novamente. |
| `Dialog`, `Sheet` | Confirmações e seleções. Forneça `returnFocusRef` quando o gatilho deverá receber o foco novamente em dispositivo nativo. |
| `Screen`, `AuthScreen`, `AppBar`, `LargeHeader`, `FooterBar`, `Section`, `Overline` | Contêineres e estrutura das telas. `Screen keyboard` ajusta a área disponível quando o teclado abre. `AuthScreen` inclui rolagem. |
| `Timeline`, `MarkdownContent`, `OrderedEditor` | Histórico, leitura de orientações e edição de linhas ordenadas. |

Textos vêm de `src/lib/strings.ts`. Use `useTheme()` para cores e os tokens de `src/lib/theme.ts` para dimensões. O componente chamador conserva a virtualização e a paginação de FlashList.

Os testes em `components.test.tsx` e `accessibility.test.tsx` cobrem renderização, interação, foco, papéis e estados acessíveis. A galeria temporária usada na construção dos componentes validou layout, cores e fechamento por teclado nos dois temas. Ampliação, TalkBack e VoiceOver exigem verificação em dispositivo.
