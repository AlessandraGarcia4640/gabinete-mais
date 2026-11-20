# Backlog v2 — fora desta entrega

Itens fora desta entrega que dependem de API, contrato, dependência ou decisão de produto. As pranchas podem ilustrar dados fictícios para os quais o app ainda não tem uma fonte.

| Item | Onde entraria | O que falta |
|---|---|---|
| Indicadores “Em atraso / Para hoje / Em andamento” | Início | Endpoint de contagem no módulo dashboard (contrato em `packages/shared` + OpenAPI). |
| Nome do responsável direto no item da listagem de tarefas | Tarefas (lista), Início | `assigneeName` no contrato da listagem; hoje o nome é resolvido por id (`useTaskPerson`). |
| Filtro por responsável, intervalo de prazo e rotina | Tarefas — filtros | A API aceita; falta decidir a interface. |
| Busca de integrantes | Folha “Escolher responsável” | Parâmetro de busca na listagem de usuários. |
| Contadores por seção | Guia de transição | Total por seção na resposta do guia. |
| Nome da rotina na lista de modelos | Modelos de checklist | Título da rotina no item da listagem. |
| Selo de progresso do checklist nas rotinas de hoje | Início | Dado de execução do dia na listagem de rotinas. |
| Dia da semana e ocorrência recorrente no resumo da rotina | Início | Agenda recorrente estruturada. O filtro atual inclui rotinas diárias sem data específica e rotinas cuja data específica coincide com o dia. |
| “N tarefas abertas” por integrante | Folha “Escolher responsável” | Contagem por pessoa na API de usuários/tarefas. |
| Contadores dos módulos | Gabinete | Endpoint de totais. |
| Contador de pendências no item “Tarefas” | Barra lateral (web) | Mesmo endpoint de contagem do Início. |
| Identificação institucional do gabinete abaixo da marca | Barra lateral (web) | O contrato da sessão não informa nome, número ou turma do gabinete. |
| “Tarefas vinculadas” ao contato | Detalhes do contato | Filtro de tarefas por contato exposto para essa tela. |
| Copiar telefone/e-mail e copiar o texto em conflito | Contato, conflito de edição | Dependência `expo-clipboard` (exige decisão). |
| Sugestões de categoria | Formulário de rotina | Endpoint de categorias em uso. |
| Contagens por seção na curadoria | Preparar transição | Total por seção na resposta do guia. |
| Abrir links externos nas orientações | Leitura da orientação | Decisão registrada em ADR (hoje bloqueado de propósito). |
| Ícone do aplicativo e splash | `app.json` | Arte própria; hoje são os padrões do Expo. |
